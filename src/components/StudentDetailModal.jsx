import { useAudit } from '../context/AuditContext';

export default function StudentDetailModal({ student, onClose }) {
  const { history } = useAudit();

  if (!student) return null;

  const timeline = history.filter(
    (entry) => entry.entity === 'student' && (!entry.entityId || entry.entityId === student._id)
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Student profile</p>
            <h2>{student.firstName} {student.lastName}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-grid">
          <div className="modal-card dark-card">
            <div className="profile-avatar">{student.firstName?.charAt(0) || 'S'}</div>
            <div>
              <p className="label">Student ID</p>
              <strong>{student.studentId}</strong>
            </div>
          </div>

          <div className="modal-card">
            <p className="label">Department</p>
            <strong>{student.department || 'N/A'}</strong>
          </div>

          <div className="modal-card">
            <p className="label">Class</p>
            <strong>{student.className || 'N/A'}</strong>
          </div>

          <div className="modal-card">
            <p className="label">Status</p>
            <strong className={`status-pill ${String(student.status || 'Active').toLowerCase()}`}>
              {student.status || 'Active'}
            </strong>
          </div>
        </div>

        <div className="modal-info-grid">
          <div>
            <p className="label">Email</p>
            <span>{student.email || 'N/A'}</span>
          </div>
          <div>
            <p className="label">Phone</p>
            <span>{student.phone || 'N/A'}</span>
          </div>
          <div>
            <p className="label">Guardian</p>
            <span>{student.guardianName || 'N/A'}</span>
          </div>
          <div>
            <p className="label">Guardian phone</p>
            <span>{student.guardianPhone || 'N/A'}</span>
          </div>
          <div>
            <p className="label">Gender</p>
            <span>{student.gender || 'N/A'}</span>
          </div>
          <div>
            <p className="label">Address</p>
            <span>{student.address || 'N/A'}</span>
          </div>
        </div>

        <div className="timeline-panel">
          <div className="panel-header-row">
            <h3>Profile timeline</h3>
          </div>
          <ul className="timeline-list">
            {timeline.length ? (
              timeline.map((entry) => (
                <li key={entry.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{entry.action}</strong>
                    <p>{entry.details?.name || student.firstName}</p>
                  </div>
                  <small>{new Date(entry.createdAt).toLocaleString()}</small>
                </li>
              ))
            ) : (
              <li className="empty-row">No activity recorded for this student yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
