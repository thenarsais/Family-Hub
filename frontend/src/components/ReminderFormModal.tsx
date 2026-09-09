import { X } from 'lucide-react';
import ReminderForm from './ReminderForm';
import type { NewReminder } from '@hooks/useReminders';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];

interface Props {
  members: FamilyMember[];
  defaultAssigneeId: string;
  onSubmit: (payload: NewReminder) => Promise<unknown>;
  onClose: () => void;
}

/** Quick-add reminder modal for the dashboard card. Mirrors EventForm's shell. */
export default function ReminderFormModal({ members, defaultAssigneeId, onSubmit, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="New reminder"
      onClick={onClose}
    >
      <div
        className="bg-raised rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-rule">
          <h3 className="text-lg font-bold text-ink">New reminder</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-accent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <ReminderForm
            members={members}
            defaultAssigneeId={defaultAssigneeId}
            onSubmit={onSubmit}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
