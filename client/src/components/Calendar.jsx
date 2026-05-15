import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(`/dashboard/calendar?month=${month}&year=${year}`);
      setTasks(res.data);
    } catch {
      // ignore
    }
  }, [month, year]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const tasksByDay = {};
  tasks.forEach((t) => {
    if (!t.due_date) return;
    const d = new Date(t.due_date);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(t);
    }
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else { setMonth((m) => m - 1); }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else { setMonth((m) => m + 1); }
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    if (tasksByDay[day]) {
      setSelectedDay(selectedDay === day ? null : day);
    }
  };

  // Determine which days have overdue tasks
  const overdueDays = new Set();
  tasks.forEach((t) => {
    if (!t.due_date || t.status === 'completed') return;
    const d = new Date(t.due_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (d < now && d.getMonth() + 1 === month && d.getFullYear() === year) {
      overdueDays.add(d.getDate());
    }
  });

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`e-${i}`} className="cal-day cal-day-empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
    const hasTask = !!tasksByDay[d];
    const isOverdue = overdueDays.has(d);
    const isSelected = selectedDay === d;
    days.push(
      <div
        key={d}
        className={`cal-day ${isToday ? 'cal-today' : ''} ${hasTask ? 'cal-has-task' : ''} ${isOverdue ? 'cal-overdue' : ''} ${isSelected ? 'cal-selected' : ''}`}
        onClick={() => handleDayClick(d)}
      >
        <span className="cal-day-num">{d}</span>
        {hasTask && <div className={`cal-dot ${isOverdue ? 'cal-dot-overdue' : ''}`} />}
      </div>
    );
  }

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth} title="Previous month">&lsaquo;</button>
        <span className="cal-title">{MONTHS[month - 1]} {year}</span>
        <button className="cal-nav" onClick={nextMonth} title="Next month">&rsaquo;</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
        {days}
      </div>

      {selectedDay && tasksByDay[selectedDay] && (
        <div className="cal-task-list">
          <div className="cal-task-list-title">
            Tasks on {MONTHS[month - 1]} {selectedDay}
          </div>
          {tasksByDay[selectedDay].map((t) => (
            <div
              key={t.id}
              className="cal-task-item"
              onClick={() => navigate(`/projects/${t.project_id}`)}
            >
              <span className={`cal-task-status cal-status-${t.status}`} />
              <span className="cal-task-title">{t.title}</span>
              {t.project_name && (
                <span className="cal-task-project">{t.project_name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
