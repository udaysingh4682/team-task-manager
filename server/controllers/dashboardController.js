const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const projects = await db.query(
      `SELECT COUNT(*) FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1`,
      [userId]
    );

    const taskFilter = isAdmin ? '' : 'AND t.assigned_to = $2';

    const tasks = await db.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1 ${taskFilter}`,
      isAdmin ? [userId] : [userId, userId]
    );

    const overdue = await db.query(
      `SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE pm.user_id = $1 ${taskFilter}
      AND t.status != 'completed'
      AND t.due_date < CURRENT_DATE
      ORDER BY t.due_date ASC`,
      isAdmin ? [userId] : [userId, userId]
    );

    const recentTasks = await db.query(
      `SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE pm.user_id = $1 ${taskFilter}
      ORDER BY t.created_at DESC LIMIT 10`,
      isAdmin ? [userId] : [userId, userId]
    );

    res.json({
      totalProjects: parseInt(projects.rows[0].count),
      tasks: tasks.rows[0],
      overdue: overdue.rows,
      recentTasks: recentTasks.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCalendarTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    let query, params;
    if (isAdmin) {
      query = `SELECT t.id, t.title, t.due_date, t.status, t.project_id, p.name as project_name,
        u.name as assigned_to_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE pm.user_id = $1
        AND EXTRACT(MONTH FROM t.due_date) = $2
        AND EXTRACT(YEAR FROM t.due_date) = $3
        ORDER BY t.due_date ASC`;
      params = [userId, m, y];
    } else {
      query = `SELECT t.id, t.title, t.due_date, t.status, t.project_id, p.name as project_name,
        u.name as assigned_to_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE pm.user_id = $1
        AND EXTRACT(MONTH FROM t.due_date) = $2
        AND EXTRACT(YEAR FROM t.due_date) = $3
        AND t.assigned_to = $4
        ORDER BY t.due_date ASC`;
      params = [userId, m, y, userId];
    }
    const { rows } = await db.query(query, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
      COUNT(DISTINCT p.id) as project_count,
      COUNT(DISTINCT t.id) as task_count
      FROM users u
      LEFT JOIN project_members pm ON u.id = pm.user_id
      LEFT JOIN projects p ON pm.project_id = p.id
      LEFT JOIN tasks t ON u.id = t.assigned_to
      GROUP BY u.id
      ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMemberTasks = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id as user_id, u.name, u.email,
        t.id as task_id, t.title as task_title, t.status, t.priority, t.due_date,
        p.id as project_id, p.name as project_name,
        t.created_by as task_creator_id
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE u.role = 'member'
      ORDER BY u.name, t.due_date ASC`
    );

    // Group by member
    const memberMap = {};
    rows.forEach((r) => {
      if (!memberMap[r.user_id]) {
        memberMap[r.user_id] = {
          id: r.user_id,
          name: r.name,
          email: r.email,
          taskCount: 0,
          tasks: [],
        };
      }
      if (r.task_id) {
        memberMap[r.user_id].tasks.push({
          id: r.task_id,
          title: r.task_title,
          status: r.status,
          priority: r.priority,
          dueDate: r.due_date,
          projectId: r.project_id,
          projectName: r.project_name,
          creatorId: r.task_creator_id,
        });
        memberMap[r.user_id].taskCount++;
      }
    });

    res.json(Object.values(memberMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const totalProjects = await db.query('SELECT COUNT(*) FROM projects');
    const totalTasks = await db.query('SELECT COUNT(*) FROM tasks');
    const tasksByStatus = await db.query(
      `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`
    );
    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalProjects: parseInt(totalProjects.rows[0].count),
      totalTasks: parseInt(totalTasks.rows[0].count),
      tasksByStatus: tasksByStatus.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    const { rows } = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
