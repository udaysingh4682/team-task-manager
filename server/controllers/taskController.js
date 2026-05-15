const db = require('../config/db');

exports.create = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, due_date, assigned_to } = req.body;
    const { rows } = await db.query(
      `INSERT INTO tasks (title, description, priority, due_date, project_id, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, priority || 'medium', due_date, projectId, assigned_to || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const isAdmin = req.user.role === 'admin';
    let query, params;
    if (isAdmin) {
      query = `SELECT t.*, u.name as assigned_to_name, cr.name as created_by_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users cr ON t.created_by = cr.id
        WHERE t.project_id = $1
        ORDER BY t.created_at DESC`;
      params = [projectId];
    } else {
      query = `SELECT t.*, u.name as assigned_to_name, cr.name as created_by_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users cr ON t.created_by = cr.id
        WHERE t.project_id = $1 AND t.assigned_to = $2
        ORDER BY t.created_at DESC`;
      params = [projectId, req.user.id];
    }
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    const { rows } = await db.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date),
        assigned_to = COALESCE($6, assigned_to),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 RETURNING *`,
      [title, description, status, priority, due_date, assigned_to, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
