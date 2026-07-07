import type { ContactPoint } from '../types'
import type { ResolutionState } from './types'

/**
 * Kinetic energy (linear + rotational when angular state exists) for one body.
 * The rotational term matters for the KE ceiling: the spin pump below adds
 * rotational energy that must count against the pair's energy budget.
 */
function bodyKineticEnergy(state: ResolutionState, index: number): number {
  const velocity = state.velocities[index]
  const mass = state.masses[index]
  if (!velocity || mass === undefined) return 0

  const linearKE = 0.5 * mass * (velocity[0] * velocity[0] + velocity[1] * velocity[1])

  const angularVelocity = state.angularVelocities?.[index]
  const inertia = state.momentsOfInertia?.[index]
  const rotationalKE =
    angularVelocity !== undefined && inertia !== undefined
      ? 0.5 * inertia * angularVelocity * angularVelocity
      : 0

  return linearKE + rotationalKE
}

/*
 * CONTACT RESOLUTION — design rationale
 *
 * The velocity response is Newton's restitution law adopted factor by factor,
 * with two algorithmic guardrails around it:
 *
 * 1. MASS SPLIT (Newton's 3rd law): the pair receives equal-and-opposite
 *    impulse, so velocity changes split by inverse mass. Equal masses behave
 *    exactly like the old equal-kick code; a light body no longer shoves a
 *    heavy one as hard as itself. Static bodies have invMass = 0, which
 *    reproduces the old x2 kick on the dynamic partner for free.
 *
 * 2. APPROACH GATE (contact forces are compressive-only): a collision is
 *    defined on approach — like a trampoline, a contact pushes while bodies
 *    move into it and lets go once they separate, even if geometry still
 *    overlaps. Discrete substeps keep re-detecting leftover overlap; without
 *    the gate each re-detection re-applied the restitution rescale (energy
 *    x e^N for a contact persisting N substeps — the "resting pile freezes"
 *    bug) or re-swapped velocities (the vibrating stuck pair). Overlap left
 *    after the one impulse is geometry residue, drained by the positional
 *    correction, not by more velocity kicks.
 *
 * 3. KICK PROPORTIONAL TO APPROACH SPEED (Newton's law of restitution):
 *    exit speed = e x entry speed — linear in velocity, independent of
 *    penetration depth. The old kick was 1/penetration and velocity-blind:
 *    the hardest impacts got the weakest response. The kick is deliberately
 *    NOT capped: with e <= 1 the impulse is self-limiting (exit energy never
 *    exceeds entry energy), and an absolute cap was tried — fast impacts
 *    (drag flings) then couldn't shed their approach velocity in one hit and
 *    plowed through bodies for several frames instead of transferring
 *    momentum. The KE ceiling below is the explosion rail, not a kick cap.
 *
 * Kept as deliberate algorithmic safety rails (NOT physics):
 * - KE ceiling: pair energy may never exceed its pre-contact value. Nearly
 *   always inert given the gate + capped kick; exists so no formula error can
 *   inject energy ("never explodes" beats "physically exact").
 * - Positional correction (slop/percent): standard Baumgarte-style overlap
 *   drain, uncapped — identical to the shipped engine. (A per-step cap was
 *   tried twice, absolute and geometry-derived: under sustained compression
 *   — a follower pack squeezing toward a shared target — any cap below
 *   "irrelevant" throttles the only response that survives callbacks that
 *   overwrite velocities each frame, and overlap accumulates to a standing
 *   equilibrium. Measured: capped held 9.5px average deep overlap in the
 *   follow scenario vs 6.6px uncapped.)
 *
 * KNOWN LIMIT: one correction pass per substep. Under continuous multi-body
 * compression, corrections between overlapping pairs conflict and a single
 * pass cannot fully converge, leaving some standing overlap (pre-existing,
 * identical in the old resolver). The proper fix is iterating the correction
 * pass, which is a solver-architecture change, not a constant.
 *
 * Pile calm needs NO rest/sleep threshold: with e < 1 every bounce loses
 * energy, and the approach gate never re-kicks a separating pair, so a
 * gravity-pressed pile converges to oscillation at the forcing amplitude —
 * measured ~0.04 px/frame average at the canvas example's gravity range,
 * visually at rest. (A velocity threshold was tried: sized high enough to
 * matter it made slow free-drifting bodies dock into clumps instead of
 * bouncing; sized safely it did nothing the physics doesn't already do.)
 *
 * Angular response — PUMP at the historical rate, BLEED explicitly:
 * - PUMP: each body's velocity kick applies a torque about the contact point,
 *   divided by the substep dt — the shipped engine's formula, kept for feel.
 *   Under the fixed-timestep accumulator this division is deterministic
 *   (dt = fixedDeltaTime / substeps, config not display refresh), so spin
 *   response is a tuning knob that scales with substep rate — deliberate feel
 *   preservation, not exact impulse physics. Adopting the physically exact
 *   un-attenuated impulse torque was tried and pumped ~16x more spin with
 *   nothing damping it: every contact injected permanent rotation and sent
 *   the follow/flocking examples orbiting.
 * - BLEED: omega x= restitution per real contact. The old every-contact
 *   energy rescale was the engine's ONLY angular damping (initial/preset
 *   tumble decayed through collisions); with the rescale demoted to
 *   ceiling-only, that decay must be explicit or spin persists forever.
 * - The KE ceiling includes rotational energy, so the pump can redistribute
 *   energy into spin but never add to the pair's total.
 */
/**
 * Returns true when a velocity impulse was applied (the pair was approaching),
 * false for overlap-only frames handled purely by positional correction.
 * Callers use this to record collisions / count bounces only for real
 * contact events — recording raw overlap made touching pairs increment the
 * bounce counter every frame (strobing bounce-reactive UIs).
 */
export function resolveContact(
  state: ResolutionState,
  indexA: number,
  indexB: number,
  contact: ContactPoint
): boolean {
  const posA = state.positions[indexA]
  const posB = state.positions[indexB]
  const velA = state.velocities[indexA]
  const velB = state.velocities[indexB]
  const massA = state.masses[indexA]
  const massB = state.masses[indexB]
  const restA = state.restitutions[indexA]
  const restB = state.restitutions[indexB]

  if (
    !posA || !posB || !velA || !velB ||
    massA === undefined || massB === undefined ||
    restA === undefined || restB === undefined
  ) {
    return false
  }

  const isStaticA = state.isStatic[indexA] ?? false
  const isStaticB = state.isStatic[indexB] ?? false

  // Skip if both are static
  if (isStaticA && isStaticB) return false

  const { normal, penetration } = contact
  const restitution = Math.min(restA, restB)

  // Static bodies are immovable: inverse mass 0 sends their whole share of the
  // impulse to the dynamic partner (doubling its kick vs an equal-mass pair).
  const invMassA = isStaticA || !(massA > 0) ? 0 : 1 / massA
  const invMassB = isStaticB || !(massB > 0) ? 0 : 1 / massB
  const invMassSum = invMassA + invMassB
  if (invMassSum <= 0) return false

  // Relative velocity along the contact normal (normal points A -> B).
  // Negative = the bodies are closing on each other.
  const relVelN =
    (velB[0] - velA[0]) * normal[0] + (velB[1] - velA[1]) * normal[1]

  // APPROACH GATE (rationale #2): velocity response only while closing
  if (relVelN < 0) {
    const approachSpeed = -relVelN

    // KICK ∝ APPROACH SPEED (rationale #3): for an equal-mass pair this yields
    // exit relative speed = restitution x entry relative speed. Uncapped —
    // self-limiting via e <= 1; the KE ceiling below is the explosion rail.
    const K = 0.5 * (1 + restitution) * approachSpeed

    // Pair energy before the impulse — ceiling for the guardrail below
    const initialKE =
      bodyKineticEnergy(state, indexA) + bodyKineticEnergy(state, indexB)

    // MASS SPLIT (rationale #1): equal-and-opposite impulse along the normal,
    // velocity change split by inverse mass
    const deltaA = 2 * K * (invMassA / invMassSum)
    const deltaB = 2 * K * (invMassB / invMassSum)

    state.velocities[indexA] = [
      velA[0] - normal[0] * deltaA,
      velA[1] - normal[1] * deltaA,
    ]
    state.velocities[indexB] = [
      velB[0] + normal[0] * deltaB,
      velB[1] + normal[1] * deltaB,
    ]

    // SPIN PUMP + BLEED (see rationale above). Pump: torque about the contact
    // point from each body's own velocity kick, divided by the substep dt —
    // the shipped engine's historical response rate. Bleed: x restitution per
    // contact, the explicit replacement for the old rescale's spin damping.
    const angularVelocities = state.angularVelocities
    const inertias = state.momentsOfInertia
    const dt = state.deltaTime ?? 0
    if (angularVelocities && inertias && dt > 0) {
      const point = contact.point

      const inertiaA = inertias[indexA] ?? 0
      if (!isStaticA && inertiaA > 0) {
        const rAx = point[0] - posA[0]
        const rAy = point[1] - posA[1]
        const torqueA = rAx * (-normal[1] * deltaA) - rAy * (-normal[0] * deltaA)
        angularVelocities[indexA] =
          ((angularVelocities[indexA] ?? 0) + (torqueA / inertiaA) / dt) * restitution
      }

      const inertiaB = inertias[indexB] ?? 0
      if (!isStaticB && inertiaB > 0) {
        const rBx = point[0] - posB[0]
        const rBy = point[1] - posB[1]
        const torqueB = rBx * (normal[1] * deltaB) - rBy * (normal[0] * deltaB)
        angularVelocities[indexB] =
          ((angularVelocities[indexB] ?? 0) + (torqueB / inertiaB) / dt) * restitution
      }
    }

    // KE CEILING (guardrail, not physics): never exit with more energy than
    // entry — polices the spin pump's redistribution too
    const finalKE =
      bodyKineticEnergy(state, indexA) + bodyKineticEnergy(state, indexB)
    if (finalKE > initialKE && finalKE > 0) {
      const scale = Math.sqrt(initialKE / finalKE)

      if (!isStaticA) {
        const newVelA = state.velocities[indexA]
        if (newVelA) {
          state.velocities[indexA] = [newVelA[0] * scale, newVelA[1] * scale]
        }
        if (angularVelocities) {
          angularVelocities[indexA] = (angularVelocities[indexA] ?? 0) * scale
        }
      }
      if (!isStaticB) {
        const newVelB = state.velocities[indexB]
        if (newVelB) {
          state.velocities[indexB] = [newVelB[0] * scale, newVelB[1] * scale]
        }
        if (angularVelocities) {
          angularVelocities[indexB] = (angularVelocities[indexB] ?? 0) * scale
        }
      }
    }
  }

  // POSITIONAL CORRECTION (guardrail): drain residual overlap geometrically,
  // split by inverse mass. Runs regardless of the approach gate — a pair that
  // is separating but still overlapping needs the geometry resolved too.
  const { slop, percent } = state
  if (penetration > slop) {
    const correction = (penetration - slop) * percent

    if (!isStaticA && invMassA > 0) {
      const share = invMassA / invMassSum
      state.positions[indexA] = [
        posA[0] - normal[0] * correction * share,
        posA[1] - normal[1] * correction * share,
      ]
    }
    if (!isStaticB && invMassB > 0) {
      const share = invMassB / invMassSum
      state.positions[indexB] = [
        posB[0] + normal[0] * correction * share,
        posB[1] + normal[1] * correction * share,
      ]
    }
  }

  return relVelN < 0
}
