import { useEffect, useMemo, useState } from 'react';
import api, { extractPayload } from '../api/client';
import { useAudit } from '../context/AuditContext';
import { exportCsv, exportPdf } from '../utils/exportUtils';
import StudentDetailModal from '../components/StudentDetailModal';

const emptyForm = {
  studentId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  className: '',
  status: 'Active',
  gender: 'Male',
  address: '',
  guardianName: '',
  guardianPhone: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { recordAuditEntry } = useAudit();

  const loadStudents = async (query = '') => {
    try {
      const response = await api.get('/students', {
        params: query ? { name: query } : {},
      });

      const payload = extractPayload(response);
      setStudents(payload?.students ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load students.');
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let filtered = students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        `${student.firstName} ${student.lastName} ${student.studentId} ${student.department} ${student.className}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || (student.status || 'Active') === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered = [...filtered].sort((a, b) => {
      const first = a[sortConfig.key] ?? '';
      const second = b[sortConfig.key] ?? '';

      if (typeof first === 'string' && typeof second === 'string') {
        return sortConfig.direction === 'asc'
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }

      const result = Number(first) - Number(second);
      return sortConfig.direction === 'asc' ? result : -result;
    });

    return filtered;
  }, [search, sortConfig, statusFilter, students]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = { ...form, email: form.email.trim() };

      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
        recordAuditEntry('updated', 'student', editingId, {
          name: `${form.firstName} ${form.lastName}`,
          department: form.department,
        });
        setMessage('Student updated successfully.');
      } else {
        const response = await api.post('/students', payload);
        const created = extractPayload(response); 
        recordAuditEntry('created', 'student', created?._id || null, {
          name: `${form.firstName} ${form.lastName}`,
          department: form.department,
        });
        setMessage('Student created successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadStudents(search);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save student.');
    }
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setForm({
      studentId: student.studentId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      department: student.department || '',
      className: student.className || '',
      status: student.status || 'Active',
      gender: student.gender || 'Male',
      address: student.address || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student record?')) return;

    try {
      const student = students.find((entry) => entry._id === id);
      await api.delete(`/students/${id}`);
      recordAuditEntry('deleted', 'student', id, {
        name: student ? `${student.firstName} ${student.lastName}` : 'Student record',
        department: student?.department || 'N/A',
      });
      setMessage('Student removed.');
      await loadStudents(search);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete student.');
    }
  };

  const exportRows = filteredStudents.map((student) => ({
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    department: student.department,
    className: student.className,
    status: student.status,
  }));

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Records</p>
          <h1>Student registry</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <h2>{editingId ? 'Edit student profile' : 'Add student profile'}</h2>
        <form className="record-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Student ID
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
            </label>
            <label>
              First name
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </label>
            <label>
              Last name
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Department
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
            </label>
            <label>
              Class name
              <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Graduated</option>
                <option>Suspended</option>
              </select>
            </label>
            <label>
              Gender
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label className="full-width">
              Address
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <label>
              Guardian name
              <input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </label>
            <label>
              Guardian phone
              <input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? 'Update student' : 'Create student'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {message ? <div className="success-box">{message}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}
      </section>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <h2>Student directory</h2>
          <div className="toolbar-controls">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
              <option value="Suspended">Suspended</option>
            </select>
            <input
              type="search"
              value={search}
              placeholder="Search profile..."
              onChange={(e) => {
                const nextValue = e.target.value;
                setSearch(nextValue);
                if (nextValue.trim()) {
                  loadStudents(nextValue);
                } else {
                  loadStudents();
                }
              }}
            />
            <button type="button" className="secondary-button" onClick={() => exportCsv(exportRows, 'students.csv')}>
              Export CSV
            </button>
            <button type="button" className="primary-button" onClick={() => exportPdf(exportRows, 'students.pdf')}>
              Export PDF
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" className="table-sort" onClick={() => handleSort('studentId')}>
                    ID
                  </button>
                </th>
                <th>
                  <button type="button" className="table-sort" onClick={() => handleSort('firstName')}>
                    Name
                  </button>
                </th>
                <th>
                  <button type="button" className="table-sort" onClick={() => handleSort('department')}>
                    Department
                  </button>
                </th>
                <th>
                  <button type="button" className="table-sort" onClick={() => handleSort('className')}>
                    Class
                  </button>
                </th>
                <th>
                  <button type="button" className="table-sort" onClick={() => handleSort('status')}>
                    Status
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id || student.studentId}>
                  <td>{student.studentId}</td>
                  <td>{student.firstName} {student.lastName}</td>
                  <td>{student.department}</td>
                  <td>{student.className}</td>
                  <td>
                    <span className={`status-pill ${String(student.status || 'Active').toLowerCase()}`}>
                      {student.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="secondary-button" onClick={() => setSelectedStudent(student)}>
                        View
                      </button>
                      <button type="button" className="secondary-button" onClick={() => handleEdit(student)}>
                        Edit
                      </button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(student._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredStudents.length && <p className="empty-state">No students match the current filter.</p>}
        </div>
      </section>

      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
