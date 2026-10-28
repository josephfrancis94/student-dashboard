import { useEffect, useMemo, useState } from 'react';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';

const emptyForm = {
  courseCode: '',
  courseName: '',
  credits: 3,
  department: '',
  semester: '',
  description: '',
  isActive: true,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { recordAuditEntry } = useAudit();

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses?limit=100');
      const payload = extractPayload(response);
      setCourses(payload?.courses ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load courses.');
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = { ...form, credits: Number(form.credits) };

      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
        recordAuditEntry('updated', 'course', editingId, {
          name: form.courseName,
          department: form.department,
        });
        setMessage('Course updated successfully.');
      } else {
        const response = await api.post('/courses', payload);
        const created = extractPayload(response);
        recordAuditEntry('created', 'course', created?._id || null, {
          name: form.courseName,
          department: form.department,
        });
        setMessage('Course created successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadCourses();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save course.');
    }
  };

  const handleEdit = (course) => {
    setEditingId(course._id);
    setForm({
      courseCode: course.courseCode || '',
      courseName: course.courseName || '',
      credits: course.credits || 3,
      department: course.department || '',
      semester: course.semester || '',
      description: course.description || '',
      isActive: course.isActive ?? true,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;

    try {
      const course = courses.find((entry) => entry._id === id);
      await api.delete(`/courses/${id}`);
      recordAuditEntry('deleted', 'course', id, {
        name: course?.courseName || 'Course',
        department: course?.department || 'N/A',
      });
      setMessage('Course deleted.');
      await loadCourses();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete course.');
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academics</p>
          <h1>Course catalog</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <h2>{editingId ? 'Edit course' : 'Add course'}</h2>
        <form className="record-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Course code
              <input value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} required />
            </label>
            <label>
              Course name
              <input value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} required />
            </label>
            <label>
              Credits
              <input type="number" min="1" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} required />
            </label>
            <label>
              Department
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
            </label>
            <label>
              Semester
              <input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </label>
            <label className="full-width">
              Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active course
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? 'Update course' : 'Create course'}
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
        <h2>Course catalog</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Credits</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id || course.courseCode}>
                  <td>{course.courseCode}</td>
                  <td>{course.courseName}</td>
                  <td>{course.department}</td>
                  <td>{course.credits}</td>
                  <td>
                    <span className={`status-pill ${course.isActive === false ? 'inactive' : 'active'}`}>
                      {course.isActive === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="secondary-button" onClick={() => handleEdit(course)}>Edit</button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(course._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!courses.length && <p className="empty-state">No courses found.</p>}
        </div>
      </section>
    </div>
  );
}
