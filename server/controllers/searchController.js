const db = require('../config/db');

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ projects: [], tasks: [] });
    }

    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const term = `%${q.trim()}%`;

    let projects, tasks;

    if (isAdmin) {
      // Admin: search all projects and tasks
      const projRes = await db.query(
        `SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.created_by = u.id
        WHERE p.name ILIKE $1 OR p.description ILIKE $1
        ORDER BY p.created_at DESC
        LIMIT 20`,
        [term]
      );
      projects = projRes.rows;

      const taskRes = await db.query(
        `SELECT t.*, p.name as project_name, u.name as assigned_to_name, cr.name as created_by_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users cr ON t.created_by = cr.id
        WHERE t.title ILIKE $1 OR t.description ILIKE $1
        ORDER BY t.created_at DESC
        LIMIT 20`,
        [term]
      );
      tasks = taskRes.rows;
    } else {
      // Member: search only their projects and assigned tasks
      const projRes = await db.query(
        `SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
        FROM projects p
        JOIN users u ON p.created_by = u.id
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1
        AND (p.name ILIKE $2 OR p.description ILIKE $2)
        ORDER BY p.created_at DESC
        LIMIT 20`,
        [userId, term]
      );
      projects = projRes.rows;

      const taskRes = await db.query(
        `SELECT t.*, p.name as project_name, u.name as assigned_to_name, cr.name as created_by_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users cr ON t.created_by = cr.id
        WHERE pm.user_id = $1
        AND t.assigned_to = $1
        AND (t.title ILIKE $2 OR t.description ILIKE $2)
        ORDER BY t.created_at DESC
        LIMIT 20`,
        [userId, term]
      );
      tasks = taskRes.rows;
    }

    res.json({ projects, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
