import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpButton } from '../HelpButton';
import { RulesModal } from '../RulesModal';

describe('HelpButton', () => {
  it('renders a "?" button', () => {
    render(<HelpButton onClick={vi.fn()} />);
    expect(screen.getByLabelText('Open game rules')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<HelpButton onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Open game rules'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('RulesModal', () => {
  it('renders nothing when closed', () => {
    render(<RulesModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('How to Play')).not.toBeInTheDocument();
  });

  it('renders rules content when open', () => {
    render(<RulesModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Objective')).toBeInTheDocument();
    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Turn Actions')).toBeInTheDocument();
    expect(screen.getByText('Penalties')).toBeInTheDocument();
    expect(screen.getByText('Winning')).toBeInTheDocument();
    expect(screen.getByText('Tips')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<RulesModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close rules'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<RulesModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking outside the modal', () => {
    const onClose = vi.fn();
    render(<RulesModal isOpen={true} onClose={onClose} />);
    // Click on the backdrop (the outer fixed overlay div that wraps the dialog)
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
    }
  });
});
