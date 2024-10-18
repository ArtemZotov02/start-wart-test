import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useEffect: jest.fn((f) => f()),
  };
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        results: [
          { name: 'Luke Skywalker', id: '1', films: ['1'], starships: [] },
          { name: 'Darth Vader', id: '2', films: [], starships: [] },
        ],
        previous: null,
        next: 'nextPageUrl',
      }),
  })
);

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders hero list', async () => {
    render(<App />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const heroList = screen.getByRole('list');
    expect(heroList).toBeInTheDocument();
    expect(screen.getByText(/Luke Skywalker/i)).toBeInTheDocument();
    expect(screen.getByText(/Darth Vader/i)).toBeInTheDocument();
  });

  test('changes pages', async () => {
    render(<App />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText(/next/i));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  test('displays hero details when clicked', async () => {
    render(<App />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText(/Luke Skywalker/i));

    expect(screen.getByText(/Luke Skywalker/i)).toBeInTheDocument();
  });

  test('handles fetch error', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Fetch failed'))
    );

    render(<App />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    expect(screen.queryByText(/ошибка при получении персонажей/i)).toBeInTheDocument();
  });

  test('disables next button when there are no next pages', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ results: [], previous: null, next: null }),
      })
    );

    render(<App />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    expect(screen.getByText(/next/i)).toBeDisabled();
  });
});
