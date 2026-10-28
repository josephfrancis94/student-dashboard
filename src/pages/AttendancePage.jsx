import { useEffect, useState } from 'react';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';

const emptyForm = {
  student: '',
  course: '',
  date: '',
  status: 'Present',
  remarks: '',
};

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { recordAuditEntry } = useAudit();

  const loadData = async () => {
    try {
      const [attendanceResponse, studentsResponse, coursesResponse] = await Promise.all([
        api.get('/attendance?limit=100'),
        api.get('/students?limit=100'),
        api.get('/courses?limit=100'),
      ]);

      const attendancePayload = extractPayload(attendanceResponse);
      const studentsPayload = extractPayload(studentsResponse);
      const coursesPayload = extractPayload(coursesResponse);

      setRecords(attendancePayload?.records ?? []);
      setStudents(studentsPayload?.students ?? []);
      setCourses(coursesPayload?.courses ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load attendance data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = { ...form, date: form.date };

      if (editingId) {
        await api.put(`/attendance/${editingId}`, payload);
        recordAuditEntry('updated', 'attendance', editingId, {
          status: form.status,
          course: form.course,
        });
        setMessage('Attendance updated.');
      } else {
        const response = await api.post('/attendance', payload);
        const created = extractPayload(response);
        recordAuditEntry('created', 'attendance', created?._id || null, {
          status: form.status,
          course: form.course,
        });
        setMessage('Attendance marked.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to record attendance.');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setForm({
      student: record.student?._id || record.student || '',
      course: record.course?._id || record.course || '',
      date: record.date ? record.date.slice(0, 10) : '',
      status: record.status || 'Present',
      remarks: record.remarks || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;

    try {
      await api.delete(`/attendance/${id}`);
      recordAuditEntry('deleted', 'attendance', id, { reason: 'attendance record removed' });
      setMessage('Attendance record deleted.');
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete attendance record.');
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Monitoring</p>
          <h1>Attendance</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <h2>{editingId ? 'Edit attendance' : 'Mark attendance'}</h2>
        <form className="record-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Student
              <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} required>
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>{student.firstName} {student.lastName}</option>
                ))}
              </select>
            </label>
            <label>
              Course
              <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required>
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>{course.courseName}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Present</option>
                <option>Absent</option>
                <option>Late</option>
                <option>Excused</option>
              </select>
            </label>
            <label className="full-width">
              Remarks
              <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows="3" />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? 'Update record' : 'Save attendance'}
            </button>
            {editingId ? (
              <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {message ? <div className="success-box">{message}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}
      </section>

      <section className="panel table-panel">
        <h2>Attendance register</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{record.student ? `${record.student.firstName} ${record.student.lastName}` : 'N/A'}</td>
                  <td>{record.course ? record.course.courseName : 'N/A'}</td>
                  <td>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`status-pill ${String(record.status || 'Present').toLowerCase()}`}>
                      {record.status || 'Present'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="secondary-button" onClick={() => handleEdit(record)}>Edit</button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(record._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length && <p className="empty-state">No attendance records found.</p>}
        </div>
      </section>
    </div>
  );
}
