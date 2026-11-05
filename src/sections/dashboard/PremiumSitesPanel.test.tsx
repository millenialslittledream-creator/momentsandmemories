import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ listPremiumSites: vi.fn(), updatePremiumSite: vi.fn(), deletePremiumSite: vi.fn() }));
vi.mock('@/lib/api', () => ({
  api: { listPremiumSites: mocks.listPremiumSites, updatePremiumSite: mocks.updatePremiumSite, deletePremiumSite: mocks.deletePremiumSite },
}));

import PremiumSitesPanel from '@/sections/dashboard/PremiumSitesPanel';

const sites = [
  { id: 's1', slug: 'ana-ben', event_key: 'marriage', design_id: 'd', theme_id: 't', published: true, updated_at: '2026-11-05T10:00:00Z' },
  { id: 's2', slug: 'baby-ria', event_key: 'babyshower', design_id: 'd', theme_id: 't', published: false, updated_at: '2026-11-04T10:00:00Z' },
];

describe('PremiumSitesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listPremiumSites.mockResolvedValue(sites);
    mocks.updatePremiumSite.mockResolvedValue({});
    mocks.deletePremiumSite.mockResolvedValue({ status: 'deleted' });
  });

  it('renders nothing for a host with no premium websites (and when loading fails)', async () => {
    mocks.listPremiumSites.mockResolvedValueOnce([]);
    const { container, unmount } = render(<PremiumSitesPanel />);
    await waitFor(() => expect(mocks.listPremiumSites).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    unmount();

    mocks.listPremiumSites.mockRejectedValueOnce(new Error('offline'));
    const second = render(<PremiumSitesPanel />);
    await waitFor(() => expect(mocks.listPremiumSites).toHaveBeenCalledTimes(2));
    expect(second.container).toBeEmptyDOMElement();
  });

  it('lists each website with its status; only published ones get a View link', async () => {
    render(<PremiumSitesPanel />);
    expect(await screen.findByText('/site/ana-ben')).toBeInTheDocument();
    expect(screen.getByText('/site/baby-ria')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('private')).toBeInTheDocument();
    expect(screen.getByText(/Wedding/)).toBeInTheDocument();
    expect(screen.getByText(/Baby shower/)).toBeInTheDocument();
    const views = screen.getAllByRole('link', { name: /view/i });
    expect(views).toHaveLength(1);
    expect(views[0]).toHaveAttribute('href', '/site/ana-ben');
  });

  it('unpublishes a published site and publishes a private one', async () => {
    render(<PremiumSitesPanel />);
    await screen.findByText('/site/ana-ben');

    fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));
    await waitFor(() => expect(mocks.updatePremiumSite).toHaveBeenCalledWith('s1', { published: false }));
    await waitFor(() => expect(screen.getAllByText('private')).toHaveLength(2));

    // the button's name is the icon word + 'Publish' (never 'Unpublish')
    fireEvent.click(screen.getAllByRole('button', { name: /\spublish$/i })[0]);
    await waitFor(() => expect(mocks.updatePremiumSite).toHaveBeenCalledWith('s1', { published: true }));
  });

  it('asks before deleting; Keep it deletes nothing; confirming removes the row', async () => {
    render(<PremiumSitesPanel />);
    await screen.findByText('/site/ana-ben');

    fireEvent.click(screen.getAllByRole('button', { name: /^delete/i })[0]);
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('/site/ana-ben');
    expect(dialog).toHaveTextContent(/cannot be undone/i);
    fireEvent.click(screen.getByRole('button', { name: /keep it/i }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(mocks.deletePremiumSite).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: /^delete/i })[0]);
    fireEvent.click(await screen.findByRole('button', { name: /delete website/i }));
    await waitFor(() => expect(mocks.deletePremiumSite).toHaveBeenCalledWith('s1'));
    await waitFor(() => expect(screen.queryByText('/site/ana-ben')).toBeNull());
    expect(screen.getByText('/site/baby-ria')).toBeInTheDocument();
  });

  it('shows the error on the page and keeps the row when the server refuses', async () => {
    mocks.updatePremiumSite.mockRejectedValue(new Error('Website not found'));
    render(<PremiumSitesPanel />);
    await screen.findByText('/site/ana-ben');
    fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Website not found');
    expect(screen.getByText('published')).toBeInTheDocument();
  });
});
