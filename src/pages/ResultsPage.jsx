import { useEffect, useState } from 'react';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';

const emptyForm = {
  student: '',
  course: '',
  examType: 'Quiz',
  score: '',
  totalMarks: '',
  remarks: '',
};

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { recordAuditEntry } = useAudit();

  const loadData = async () => {
    try {
      const [resultsResponse, studentsResponse, coursesResponse] = await Promise.all([
        api.get('/results?limit=100'),
        api.get('/students?limit=100'),
        api.get('/courses?limit=100'),
      ]);

      const resultsPayload = extractPayload(resultsResponse);
      const studentsPayload = extractPayload(studentsResponse);
      const coursesPayload = extractPayload(coursesResponse);

      setResults(resultsPayload?.results ?? []);
      setStudents(studentsPayload?.students ?? []);
      setCourses(coursesPayload?.courses ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load result data.');
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
      const payload = {
        ...form,
        score: Number(form.score),
        totalMarks: Number(form.totalMarks),
      };

      if (editingId) {
        await api.put(`/results/${editingId}`, payload);
        recordAuditEntry('updated', 'result', editingId, {
          examType: form.examType,
          score: form.score,
        });
        setMessage('Result updated.');
      } else {
        const response = await api.post('/results', payload);
        const created = extractPayload(response);
        recordAuditEntry('created', 'result', created?._id || null, {
          examType: form.examType,
          score: form.score,
        });
        setMessage('Result added.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save result.');
    }
  };

  const handleEdit = (result) => {
    setEditingId(result._id);
    setForm({
      student: result.student?._id || result.student || '',
      course: result.course?._id || result.course || '',
      examType: result.examType || 'Quiz',
      score: result.score ?? '',
      totalMarks: result.totalMarks ?? '',
      remarks: result.remarks || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;

    try {
      await api.delete(`/results/${id}`);
      recordAuditEntry('deleted', 'result', id, { reason: 'result removed' });
      setMessage('Result deleted.');
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete result.');
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academic performance</p>
          <h1>Results</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <h2>{editingId ? 'Edit result' : 'Record result'}</h2>
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
              Exam type
              <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                <option>Quiz</option>
                <option>Assignment</option>
                <option>Midterm</option>
                <option>Final</option>
                <option>Practical</option>
              </select>
            </label>
            <label>
              Score
              <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required />
            </label>
            <label>
              Total marks
              <input type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} required />
            </label>
            <label className="full-width">
              Remarks
              <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows="3" />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? 'Update result' : 'Save result'}
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
        <h2>Results log</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Type</th>
                <th>Grade</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result._id}>
                  <td>{result.student ? `${result.student.firstName} ${result.student.lastName}` : 'N/A'}</td>
                  <td>{result.course ? result.course.courseName : 'N/A'}</td>
                  <td>{result.examType}</td>
                  <td>{result.grade || 'N/A'}</td>
                  <td>{result.score} / {result.totalMarks}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="secondary-button" onClick={() => handleEdit(result)}>Edit</button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(result._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!results.length && <p className="empty-state">No results found.</p>}
        </div>
      </section>
    </div>
  );
}
