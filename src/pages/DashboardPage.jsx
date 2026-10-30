import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';

const formatCount = (value) => (Number.isFinite(value) ? value : 0);
const chartColors = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444'];

function ChartCard({ title, data, color, badge, badgeClass, type = 'bar', children }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header-row">
        <h2>{title}</h2>
        {badge ? <span className={`mini-badge ${badgeClass || ''}`}>{badge}</span> : null}
      </div>
      <div className="chart-wrap">
        {children || (
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
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={86} paddingAngle={4}>
                    {data.map((entry, index) => (
                      <Cell key={`${entry.label}-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState({ students: [], courses: [], attendance: [], results: [] });
  const [loading, setLoading] = useState(true);
  const { history } = useAudit();

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

  const stats = useMemo(
    () => [
      { label: 'Students', value: formatCount(summary.students.length), tone: 'blue' },
      { label: 'Courses', value: formatCount(summary.courses.length), tone: 'green' },
      { label: 'Attendance', value: formatCount(summary.attendance.length), tone: 'orange' },
      { label: 'Results', value: formatCount(summary.results.length), tone: 'purple' },
    ],
    [summary]
  );

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

    return Object.values(buckets).slice(-6).map((item) => ({
      label: item.label,
      value: Math.round((item.present / Math.max(item.total, 1)) * 100),
    }));
  }, [summary.attendance]);

  const performanceTrend = useMemo(() => {
    if (!summary.results.length) {
      return [
        { label: 'Q1', value: 62 },
        { label: 'Q2', value: 68 },
        { label: 'Q3', value: 74 },
        { label: 'Q4', value: 81 },
      ];
    }

    const buckets = {};
    summary.results.forEach((result) => {
      const rawDate = result.date || result.examDate || result.createdAt;
      const label = rawDate ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short' }) : 'Current';
      const score = Number(result.score || 0);
      const total = Number(result.totalMarks || 0) || 100;
      const pct = total ? Math.round((score / total) * 100) : 0;
      buckets[label] = buckets[label] ? Math.round((buckets[label] + pct) / 2) : pct;
    });

    return Object.entries(buckets).slice(-6).map(([label, value]) => ({ label, value }));
  }, [summary.results]);

  const studentStatusMix = useMemo(() => {
    const counts = { Active: 0, Inactive: 0, Graduated: 0, Suspended: 0 };
    summary.students.forEach((student) => {
      const status = student.status || 'Active';
      if (counts[status] !== undefined) counts[status] += 1;
    });

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [summary.students]);

  const averageAttendance = useMemo(() => {
    if (!summary.attendance.length) return 82;
    const presentCount = summary.attendance.filter((record) => String(record.status || 'Present') === 'Present').length;
    return Math.round((presentCount / summary.attendance.length) * 100);
  }, [summary.attendance]);

  const averageScore = useMemo(() => {
    if (!summary.results.length) return 76;
    const totalScore = summary.results.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const totalMarks = summary.results.reduce((sum, item) => sum + Number(item.totalMarks || 0), 0);
    if (!totalMarks) return 0;
    return Math.round((totalScore / totalMarks) * 100);
  }, [summary.results]);

  const topInsights = useMemo(() => {
    const activeStudents = summary.students.filter((student) => (student.status || 'Active') === 'Active').length;
    const avgCourseCount = summary.courses.length ? Math.max(1, Math.round(summary.courses.length / 3)) : 0;
    return [
      { label: 'Active learners', value: `${activeStudents} students` },
      { label: 'Program coverage', value: `${summary.courses.length} courses` },
      { label: 'Academic pulse', value: `${averageScore}% avg score` },
      { label: 'Attendance health', value: `${averageAttendance}% present` },
      { label: 'Audit trail', value: `${history.length} events` },
      { label: 'Course load', value: `${avgCourseCount} per stream` },
    ];
  }, [summary, averageAttendance, averageScore, history]);

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
              </article>
            ))}
          </section>

          <section className="analytics-grid">
            <ChartCard title="Performance trend" data={performanceTrend} color="#4f46e5" badge={`${averageScore}%`} badgeClass="success" type="area" />
            <ChartCard title="Department mix" data={departmentBreakdown} color="#10b981" badge="Students" type="pie" />
            <ChartCard title="Attendance health" data={attendanceTrend} color="#0ea5e9" badge={`${averageAttendance}%`} badgeClass="accent" type="line" />
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
                <h2>Student status</h2>
                <span className="mini-badge">Status</span>
              </div>
              <ul className="mini-list metric-list">
                {studentStatusMix.map((entry) => (
                  <li key={entry.label}>
                    <span>{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <ChartCard title="Class activity" data={studentStatusMix} color="#f59e0b" badge="Mix" type="bar" />
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

