import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('../../services/api', () => ({ apiClient: { post: vi.fn() } }));

import { apiClient } from '../../services/api';
import { AddFromPhotoModal } from '@/components/Calendar/AddFromPhotoModal';

const mockPost = apiClient.post as ReturnType<typeof vi.fn>;

// jsdom implements neither image decoding nor a real canvas context, so the
// client-side downscale step is faked at its three DOM seams: reading the
// file, "decoding" it into an Image, and drawing/encoding via canvas.
class FakeFileReader {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | null = null;
  readAsDataURL() {
    this.result = 'data:image/png;base64,ZmFrZQ==';
    queueMicrotask(() => this.onload?.());
  }
}

class FakeImage {
  width = 800;
  height = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

function setup() {
  render(<AddFromPhotoModal createEvent={createEvent} onClose={onClose} />);
}

const createEvent = vi.fn();
const onClose = vi.fn();

async function pickAPhoto() {
  const file = new File(['fake'], 'flyer.png', { type: 'image/png' });
  const input = screen.getByTestId('add-from-photo-input');
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  createEvent.mockResolvedValue({});
  vi.stubGlobal('FileReader', FakeFileReader);
  vi.stubGlobal('Image', FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,cmVzaXplZA==');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AddFromPhotoModal', () => {
  it('shows the photo-picker prompt initially', () => {
    setup();
    expect(screen.getByRole('button', { name: /take or choose a photo/i })).toBeInTheDocument();
  });

  it('uploads the resized photo and shows extracted drafts for review', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        data: [
          { summary: 'Soccer practice', allDay: false, startDate: '2026-09-20', startTime: '16:00', location: 'Park' },
        ],
      },
    });
    setup();

    await pickAPhoto();

    await waitFor(() => expect(screen.getByDisplayValue('Soccer practice')).toBeInTheDocument());
    expect(mockPost).toHaveBeenCalledWith(
      '/api/calendar/photo-import',
      { image: 'cmVzaXplZA==', mimeType: 'image/jpeg' },
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(screen.getByRole('button', { name: /add 1 event/i })).toBeInTheDocument();
  });

  it('shows a message when no events are found', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: [] } });
    setup();

    await pickAPhoto();

    await waitFor(() => expect(screen.getByText(/no events found/i)).toBeInTheDocument());
  });

  it('goes back to the picker with an error message when the upload fails', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Photo import is not set up yet' } } });
    setup();

    await pickAPhoto();

    await waitFor(() => expect(screen.getByText(/not set up yet/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /take or choose a photo/i })).toBeInTheDocument();
  });

  it('unchecking a draft excludes it from the add count', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        data: [
          { summary: 'Event A', allDay: true, startDate: '2026-09-20' },
          { summary: 'Event B', allDay: true, startDate: '2026-09-21' },
        ],
      },
    });
    setup();
    await pickAPhoto();
    await waitFor(() => expect(screen.getByRole('button', { name: /add 2 events/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('checkbox', { name: /include event a/i }));

    expect(screen.getByRole('button', { name: /add 1 event$/i })).toBeInTheDocument();
  });

  it('creates each included draft and closes on full success', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        data: [
          { summary: 'Event A', allDay: true, startDate: '2026-09-20' },
          { summary: 'Event B', allDay: false, startDate: '2026-09-21', startTime: '10:00' },
        ],
      },
    });
    setup();
    await pickAPhoto();
    await waitFor(() => expect(screen.getByRole('button', { name: /add 2 events/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /add 2 events/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createEvent).toHaveBeenCalledTimes(2);
    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Event A', allDay: true }));
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Event B', allDay: false, startTime: '10:00' }),
    );
  });

  it('keeps failed drafts checked and reports which ones failed, without closing', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        data: [
          { summary: 'Good one', allDay: true, startDate: '2026-09-20' },
          { summary: 'Bad one', allDay: true, startDate: '2026-09-21' },
        ],
      },
    });
    createEvent.mockImplementation(async (input: { summary: string }) => {
      if (input.summary === 'Bad one') throw new Error('boom');
      return {};
    });
    setup();
    await pickAPhoto();
    await waitFor(() => expect(screen.getByRole('button', { name: /add 2 events/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /add 2 events/i }));

    await waitFor(() => expect(screen.getByText(/couldn't add: Bad one/i)).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
    // The succeeded draft is no longer counted; the failed one still is.
    expect(screen.getByRole('button', { name: /add 1 event$/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked from the review step', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: [{ summary: 'Event A', allDay: true, startDate: '2026-09-20' }] },
    });
    setup();
    await pickAPhoto();
    await waitFor(() => expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the header close button is clicked', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
