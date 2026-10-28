import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';

const formatCount = (value) => (Number.isFinite(value) ? value : 0);

function ChartCard({ title, data, color, badge, badgeClass }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header-row">
        <h2>{title}</h2>
        <span className={`mini-badge ${badgeClass || ''}`}>{badge}</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <RechartsBarChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
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

  const attendanceStatus = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };

    summary.attendance.forEach((record) => {
      const status = record.status || 'Present';
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [summary.attendance]);

  const gradeBreakdown = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    summary.results.forEach((result) => {
      const grade = result.grade || 'F';
      if (counts[grade] !== undefined) {
        counts[grade] += 1;
      }
    });

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [summary.results]);

  const averageAttendance = useMemo(() => {
    if (!summary.attendance.length) return 0;
    const presentCount = summary.attendance.filter((record) => record.status === 'Present').length;
    return Math.round((presentCount / summary.attendance.length) * 100);
  }, [summary.attendance]);

  const averageScore = useMemo(() => {
    if (!summary.results.length) return 0;
    const totalScore = summary.results.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const totalMarks = summary.results.reduce((sum, item) => sum + Number(item.totalMarks || 0), 0);
    if (!totalMarks) return 0;
    return Math.round((totalScore / totalMarks) * 100);
  }, [summary.results]);

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

          <section className="widget-grid analytics-grid">
            <ChartCard title="Department split" data={departmentBreakdown} color="#4f46e5" badge="Students" />
            <ChartCard title="Attendance status" data={attendanceStatus} color="#10b981" badge={`${averageAttendance}%`} badgeClass="success" />
            <ChartCard title="Grade outcomes" data={gradeBreakdown} color="#f59e0b" badge={`${averageScore}%`} badgeClass="warning" />
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
