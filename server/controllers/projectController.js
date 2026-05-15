const db = require('../config/db');

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { rows } = await db.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, 'admin']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, u.name as creator_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
      ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    let query, params;
    if (isAdmin) {
      query = `SELECT p.*, u.name as creator_name FROM projects p
        JOIN users u ON p.created_by = u.id
        WHERE p.id = $1`;
      params = [id];
    } else {
      query = `SELECT p.*, u.name as creator_name FROM projects p
        JOIN users u ON p.created_by = u.id
        JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = $1 AND pm.user_id = $2`;
      params = [id, req.user.id];
    }

    const { rows } = await db.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { rows } = await db.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
