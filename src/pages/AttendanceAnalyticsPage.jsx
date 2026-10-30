import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import api, { extractPayload } from '../api/client';
import { exportCsv, exportPdf } from '../utils/exportUtils';

const colorMap = ['#4f46e5', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ef4444'];

export default function AttendanceAnalyticsPage() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attendanceResponse, studentsResponse, coursesResponse] = await Promise.all([
          api.get('/attendance?limit=100'),
          api.get('/students?limit=100'),
          api.get('/courses?limit=100'),
        ]);

        setRecords(extractPayload(attendanceResponse)?.records ?? []);
        setStudents(extractPayload(studentsResponse)?.students ?? []);
        setCourses(extractPayload(coursesResponse)?.courses ?? []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const summary = useMemo(() => {
    const total = records.length || 1;
    const present = records.filter((record) => String(record.status || 'Present') === 'Present').length;
    const absent = records.filter((record) => String(record.status || 'Absent') === 'Absent').length;
    const late = records.filter((record) => String(record.status || 'Late') === 'Late').length;
    const excused = records.filter((record) => String(record.status || 'Excused') === 'Excused').length;

    return {
      total,
      present,
      absent,
      late,
      excused,
      rate: Math.round((present / total) * 100),
    };
  }, [records]);

  const dailyTrend = useMemo(() => {
    const buckets = {};

    records.forEach((record) => {
      const label = record.date ? new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today';
      buckets[label] = buckets[label] || { label, present: 0, total: 0 };
      buckets[label].total += 1;
      if (String(record.status || 'Present') === 'Present') {
        buckets[label].present += 1;
      }
    });

    return Object.values(buckets).slice(-7).map((entry) => ({
      label: entry.label,
      value: Math.round((entry.present / Math.max(entry.total, 1)) * 100),
    }));
  }, [records]);

  const statusMix = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    records.forEach((record) => {
      const status = record.status || 'Present';
      if (counts[status] !== undefined) counts[status] += 1;
    });

    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [records]);

  const courseBreakdown = useMemo(() => {
    const counts = {};
    records.forEach((record) => {
      const label = record.course?.courseName || record.course || 'General';
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts).slice(0, 5).map(([label, value]) => ({ label, value }));
  }, [records]);

  const exportRows = records.map((record) => ({
    student: record.student ? `${record.student.firstName} ${record.student.lastName}` : 'N/A',
    course: record.course?.courseName || record.course || 'N/A',
    date: record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
    status: record.status || 'Present',
    remarks: record.remarks || '',
  }));

  const statTiles = [
    { label: 'Total sessions', value: summary.total, tone: 'blue' },
    { label: 'Present', value: `${summary.present}`, tone: 'green' },
    { label: 'Attendance rate', value: `${summary.rate}%`, tone: 'orange' },
    { label: 'Late / excused', value: `${summary.late + summary.excused}`, tone: 'purple' },
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Monitoring</p>
          <h1>Attendance analytics</h1>
        </div>
      </header>

      {loading ? (
        <div className="loading-box">Loading attendance analytics...</div>
      ) : (
        <>
          <section className="stats-grid">
            {statTiles.map((tile) => (
              <article key={tile.label} className={`stat-card ${tile.tone}`}>
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
              </article>
            ))}
          </section>

          <section className="analytics-grid">
            <div className="panel chart-panel">
              <div className="panel-header-row">
                <h2>Daily attendance rate</h2>
                <span className="mini-badge success">{summary.rate}%</span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel chart-panel">
              <div className="panel-header-row">
                <h2>Status mix</h2>
                <span className="mini-badge accent">Overview</span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusMix} dataKey="value" nameKey="label" innerRadius={52} outerRadius={86} paddingAngle={4}>
                      {statusMix.map((entry, index) => (
                        <Cell key={`${entry.label}-${index}`} fill={colorMap[index % colorMap.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="widget-grid analytics-grid">
            <div className="panel">
              <div className="panel-header-row">
                <h2>Course intensity</h2>
                <span className="mini-badge">Top 5</span>
              </div>
              <ul className="mini-list">
                {courseBreakdown.map((entry) => (
                  <li key={entry.label}>
                    <span>{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <div className="panel-header-row">
                <h2>Attendance summary</h2>
                <span className="mini-badge accent">Live</span>
              </div>
              <div className="summary-stack">
                <div className="summary-row">
                  <span>Present</span>
                  <strong>{summary.present}</strong>
                </div>
                <div className="summary-row">
                  <span>Absent</span>
                  <strong>{summary.absent}</strong>
                </div>
                <div className="summary-row">
                  <span>Late</span>
                  <strong>{summary.late}</strong>
                </div>
                <div className="summary-row">
                  <span>Excused</span>
                  <strong>{summary.excused}</strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header-row">
                <h2>Quick export</h2>
                <span className="mini-badge">CSV / PDF</span>
              </div>
              <div className="button-stack">
                <button type="button" className="secondary-button" onClick={() => exportCsv(exportRows, 'attendance.csv')}>
                  Export CSV
                </button>
                <button type="button" className="primary-button" onClick={() => exportPdf(exportRows, 'attendance.pdf', 'Attendance Summary')}>
                  Export PDF
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
