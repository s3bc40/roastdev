import { LuCheck } from 'react-icons/lu';

export default function Toast({ message }) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">
        <LuCheck size={14} />
      </span>
      {message}
    </div>
  );
}
