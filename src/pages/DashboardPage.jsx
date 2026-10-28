import { useEffect, useMemo, useState } from 'react';
import api, { extractPayload } from '../api/client';

const formatCount = (value) => (Number.isFinite(value) ? value : 0);

export default function DashboardPage() {
  const [summary, setSummary] = useState({ students: [], courses: [], attendance: [], results: [] });
  const [loading, setLoading] = useState(true);

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
      {
        label: 'Students',
        value: formatCount(summary.students.length),
        tone: 'blue',
      },
      {
        label: 'Courses',
        value: formatCount(summary.courses.length),
        tone: 'green',
      },
      {
        label: 'Attendance',
        value: formatCount(summary.attendance.length),
        tone: 'orange',
      },
      {
        label: 'Results',
        value: formatCount(summary.results.length),
        tone: 'purple',
      },
    ],
    [summary]
  );

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      {loading ? (
        <div className="loading-box">Loading dashboard data...</div>
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

          <section className="info-grid">
            <div className="panel">
              <h2>Recent student entries</h2>
              <ul className="mini-list">
                {summary.students.slice(0, 5).map((student) => (
                  <li key={student._id || student.studentId}>
                    <span>{student.firstName} {student.lastName}</span>
                    <strong>{student.studentId}</strong>
                  </li>
                ))}
                {!summary.students.length && <li className="empty-row">No students found.</li>}
              </ul>
            </div>

            <div className="panel">
              <h2>Latest course list</h2>
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
          </section>
        </>
      )}
    </div>
  );
}
