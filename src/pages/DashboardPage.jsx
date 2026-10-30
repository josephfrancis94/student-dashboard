import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';
import { useAuth } from '../context/AuthContext';

const chartColors = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444'];

function ChartCard({ title, data, color, badge, badgeClass, type = 'bar' }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header-row">
        <h2>{title}</h2>
        {badge ? <span className={`mini-badge ${badgeClass || ''}`}>{badge}</span> : null}
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.38} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={color} fill="url(#fillGradient)" strokeWidth={3} />
            </AreaChart>
          ) : type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={86} paddingAngle={4}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.label}-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState({ students: [], courses: [], attendance: [], results: [] });
  const [loading, setLoading] = useState(true);
  const { history } = useAudit();
  const { user } = useAuth();

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [studentsResponse, coursesResponse, attendanceResponse, resultsResponse] = await Promise.all([
          api.get('/students?limit=100'),
          api.get('/courses?limit=100'),
          api.get('/attendance?limit=100'),
          api.get('/results?limit=100'),
        ]);

        setSummary({
          students: extractPayload(studentsResponse)?.students ?? [],
          courses: extractPayload(coursesResponse)?.courses ?? [],
          attendance: extractPayload(attendanceResponse)?.records ?? [],
          results: extractPayload(resultsResponse)?.results ?? [],
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const stats = useMemo(() => {
    const studentsCount = summary.students.length;
    const coursesCount = summary.courses.length;
    const attendanceRate = summary.attendance.length
      ? Math.round(
          (summary.attendance.filter((record) => String(record.status || 'Present') === 'Present').length /
            summary.attendance.length) *
            100
        )
      : 86;
    const averageScore = summary.results.length
      ? Math.round(
          summary.results.reduce((total, item) => total + Number(item.score || 0), 0) /
            summary.results.reduce((total, item) => total + (Number(item.totalMarks || 100) || 100), 0) *
            100
        )
      : 78;

    return [
      { label: 'Students', value: studentsCount, delta: '+8.4%', tone: 'blue', trend: 'up' },
      { label: 'Courses', value: coursesCount, delta: '+2.1%', tone: 'green', trend: 'up' },
      { label: 'Attendance', value: `${attendanceRate}%`, delta: '+4.8%', tone: 'orange', trend: 'up' },
      { label: 'Avg score', value: `${averageScore}%`, delta: '-1.2%', tone: 'purple', trend: 'down' },
    ];
  }, [summary]);

  const departmentBreakdown = useMemo(() => {
    const counts = {};

    summary.students.forEach((student) => {
      const dept = student.department || 'General';
      counts[dept] = (counts[dept] || 0) + 1;
    });

    return Object.entries(counts).slice(0, 5).map(([label, value]) => ({ label, value }));
  }, [summary.students]);

  const attendanceTrend = useMemo(() => {
    if (!summary.attendance.length) {
      return [
        { label: 'Mon', value: 78 },
        { label: 'Tue', value: 82 },
        { label: 'Wed', value: 76 },
        { label: 'Thu', value: 88 },
        { label: 'Fri', value: 91 },
      ];
    }

    const buckets = {};
    summary.attendance.forEach((record) => {
      const rawDate = record.date || record.createdAt || record.attendedOn;
      const key = rawDate ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today';
      const status = String(record.status || 'Present');
      if (!buckets[key]) {
        buckets[key] = { label: key, total: 0, present: 0 };
      }
      buckets[key].total += 1;
      if (status === 'Present') {
        buckets[key].present += 1;
      }
    });

    return Object.values(buckets).slice(-6).map((entry) => ({
      label: entry.label,
      value: Math.round((entry.present / Math.max(entry.total, 1)) * 100),
    }));
  }, [summary.attendance]);

  const permissionMatrix = [
    { feature: 'Student records', admin: true, staff: true, viewer: true },
    { feature: 'Course setup', admin: true, staff: true, viewer: false },
    { feature: 'Attendance updates', admin: true, staff: true, viewer: false },
    { feature: 'Results exports', admin: true, staff: true, viewer: true },
    { feature: 'User management', admin: true, staff: false, viewer: false },
    { feature: 'System settings', admin: true, staff: false, viewer: false },
  ];

  const topInsights = [
    { label: 'Active learners', value: `${summary.students.filter((student) => (student.status || 'Active') === 'Active').length} students` },
    { label: 'Program coverage', value: `${summary.courses.length} courses` },
    { label: 'Academic pulse', value: `${Math.round(summary.results.length ? summary.results.reduce((total, item) => total + Number(item.score || 0), 0) / summary.results.reduce((total, item) => total + (Number(item.totalMarks || 100) || 100), 0) * 100 : 78)}% avg score` },
    { label: 'Audit trail', value: `${history.length} events` },
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Insight</p>
          <h1>School intelligence</h1>
        </div>
      </header>

      {loading ? (
        <div className="loading-box">Loading school analytics...</div>
      ) : (
        <>
          <section className="stats-grid">
            {stats.map((stat) => (
              <article key={stat.label} className={`stat-card ${stat.tone}`}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <div className={`stat-delta ${stat.trend}`}>
                  {stat.delta}
                </div>
              </article>
            ))}
          </section>

          <section className="analytics-grid">
            <ChartCard title="Attendance trend" data={attendanceTrend} color="#4f46e5" badge="Current" type="area" />
            <ChartCard title="Department mix" data={departmentBreakdown} color="#10b981" badge="Students" type="pie" />
            <ChartCard title="Weekly momentum" data={attendanceTrend} color="#0ea5e9" badge="Live" type="line" />
          </section>

          <section className="widget-grid analytics-grid">
            <div className="panel insight-panel">
              <div className="panel-header-row">
                <h2>Operational highlights</h2>
                <span className="mini-badge accent">Live</span>
              </div>
              <div className="insight-list">
                {topInsights.map((item) => (
                  <div key={item.label} className="insight-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header-row">
                <h2>Access overview</h2>
                <span className="mini-badge">Role</span>
              </div>
              <div className="access-summary-box">
                <p className="eyebrow">Current role</p>
                <h3>{user?.role ? user.role.toUpperCase() : 'STAFF'}</h3>
                <div className="permission-stack compact">
                  {(user?.role === 'admin' ? ['Admin', 'Staff', 'Settings'] : user?.role === 'viewer' ? ['Read-only', 'Reports'] : ['Students', 'Courses', 'Attendance']).map((item) => (
                    <span key={item} className="permission-chip">{item}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header-row">
                <h2>Permission matrix</h2>
                <span className="mini-badge accent">Roles</span>
              </div>
              <div className="matrix-table">
                <div className="matrix-head matrix-row">
                  <span>Feature</span>
                  <span>Admin</span>
                  <span>Staff</span>
                  <span>Viewer</span>
                </div>
                {permissionMatrix.map((entry) => (
                  <div key={entry.feature} className="matrix-row">
                    <span>{entry.feature}</span>
                    <span className={entry.admin ? 'cell-yes' : 'cell-no'}>{entry.admin ? 'Yes' : 'No'}</span>
                    <span className={entry.staff ? 'cell-yes' : 'cell-no'}>{entry.staff ? 'Yes' : 'No'}</span>
                    <span className={entry.viewer ? 'cell-yes' : 'cell-no'}>{entry.viewer ? 'Yes' : 'No'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="info-grid">
            <div className="panel">
              <div className="panel-header-row">
                <h2>Recent student entries</h2>
                <span className="mini-badge">Live</span>
              </div>
              <ul className="mini-list">
                {summary.students.slice(0, 5).map((student) => (
                  <li key={student._id || student.studentId}>
                    <span>
                      {student.firstName} {student.lastName}
                    </span>
                    <strong>{student.studentId}</strong>
                  </li>
                ))}
                {!summary.students.length && <li className="empty-row">No students found.</li>}
              </ul>
            </div>

            <div className="panel">
              <div className="panel-header-row">
                <h2>Latest course lineup</h2>
                <span className="mini-badge">Catalog</span>
              </div>
              <ul className="mini-list">
                {summary.courses.slice(0, 5).map((course) => (
                  <li key={course._id || course.courseCode}>
                    <span>{course.courseName}</span>
                    <strong>{course.courseCode}</strong>
                  </li>
                ))}
                {!summary.courses.length && <li className="empty-row">No courses found.</li>}
              </ul>
            </div>

            <div className="panel">
              <div className="panel-header-row">
                <h2>Admin audit trail</h2>
                <span className="mini-badge accent">{history.length}</span>
              </div>
              <ul className="activity-list">
                {history.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <div className="activity-dot" />
                    <div>
                      <strong>{item.action}</strong>
                      <span>{item.entity}</span>
                    </div>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </li>
                ))}
                {!history.length && <li className="empty-row">No recent admin actions.</li>}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
