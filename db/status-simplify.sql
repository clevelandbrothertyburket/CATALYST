-- Simplify code lifecycle to Active / Paused (+ Remove = hard delete).
-- Map legacy statuses and remove archived codes.
UPDATE codes SET status='paused', updated_at=now() WHERE status IN ('deprecated','retired');
DELETE FROM codes WHERE status='archived';
