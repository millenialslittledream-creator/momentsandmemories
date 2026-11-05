import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineNotice from '@/components/InlineNotice';

describe('InlineNotice', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<InlineNotice notice={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces errors as alerts and other messages as status', () => {
    const { rerender } = render(<InlineNotice notice={{ kind: 'error', text: 'Wrong code' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Wrong code');
    rerender(<InlineNotice notice={{ kind: 'success', text: 'Saved' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
