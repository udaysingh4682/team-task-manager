const db = require('../config/db');

exports.addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    const { rows } = await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [projectId, userId, role || 'member']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User is already a member' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rows } = await db.query(
      `SELECT pm.id, pm.role, u.id as user_id, u.name, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1`,
      [projectId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { rowCount } = await db.query(
      'DELETE FROM project_members WHERE id = $1 AND project_id = $2',
      [memberId, projectId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
