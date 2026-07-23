import * as API from 'shared/api';
import CreateLifecycle from '../CreateLifecycle';
import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {CATALOG_FIELDS_PAGE_SIZE_ALL} from 'shared/api/catalog';
import {Routes, toRoute} from 'shared/util/router';
import {useRequest} from 'shared/hooks/useRequest';

jest.unmock('react-dom');

jest.mock('shared/hooks/useRequest', () => ({
	useRequest: jest.fn(),
}));

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
}));

const mockPush = jest.fn();

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useHistory: () => ({push: mockPush}),
	useParams: () => ({channelId: '123', groupId: '23'}),
}));

const mockedUseRequest = useRequest as jest.Mock;

const renderPage = () =>
	render(
		<MemoryRouter>
			<CreateLifecycle />
		</MemoryRouter>
	);

const lifecycleURL = toRoute(Routes.LIFECYCLE, {
	channelId: '123',
	groupId: '23',
});

describe('CreateLifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(API as any).catalog = {fetchCatalogFields: jest.fn()};

		(API as any).lifecycle = {
			createLifecycle: jest.fn().mockResolvedValue({}),
			fetchLifecycles: jest.fn(),
		};

		mockedUseRequest.mockReturnValue({data: [], loading: false});
	});

	it('renders the top nav with title and actions', () => {
		renderPage();

		expect(screen.getByText('Lifecycle Settings')).toBeInTheDocument();
		expect(
			screen.getByRole('button', {name: 'Cancel'})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {name: 'Create'})
		).toBeInTheDocument();
	});

	it('renders six stage panels with the first expanded', () => {
		renderPage();

		[1, 2, 3, 4, 5, 6].forEach((stageNumber) =>
			expect(screen.getByText(`Stage ${stageNumber}`)).toBeInTheDocument()
		);

		expect(screen.getByText('Aware')).toBeInTheDocument();
	});

	it('renders the Lifecycle Name input and updates its value', () => {
		renderPage();

		const nameInput = screen.getByLabelText('Lifecycle Name');

		expect(nameInput).toBeInTheDocument();

		fireEvent.change(nameInput, {target: {value: 'My Lifecycle'}});

		expect(nameInput).toHaveValue('My Lifecycle');
	});

	it('navigates to the dashboard on cancel', () => {
		renderPage();

		fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));

		expect(mockPush).toHaveBeenCalledWith(lifecycleURL);
	});

	it('disables Create until every stage is configured', () => {
		renderPage();

		const createButton = screen.getByRole('button', {name: 'Create'});

		expect(createButton).toBeDisabled();

		fireEvent.click(createButton);

		expect(mockPush).not.toHaveBeenCalled();
	});

	it('renders a loading state while lifecycles are loading', () => {
		mockedUseRequest.mockReturnValue({data: undefined, loading: true});

		renderPage();

		expect(screen.queryByText('Lifecycle Settings')).toBeNull();
		expect(screen.queryByText('Stage Configuration')).toBeNull();
	});

	it('redirects to a 404 when a lifecycle already exists', () => {
		mockedUseRequest.mockReturnValue({
			data: [{id: '1'}],
			loading: false,
		});

		renderPage();

		expect(screen.queryByText('Lifecycle Settings')).toBeNull();
		expect(screen.queryByText('Stage Configuration')).toBeNull();
	});

	it('requests the entire catalog in a single page', () => {
		renderPage();

		expect(mockedUseRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				dataSourceFn: (API as any).catalog.fetchCatalogFields,
				variables: expect.objectContaining({
					entity: 'account',
					pageSize: CATALOG_FIELDS_PAGE_SIZE_ALL,
				}),
			})
		);
	});

	it('surfaces an error state when the catalog request fails', () => {
		const refetch = jest.fn();

		mockedUseRequest.mockImplementation(({dataSourceFn}: any) =>
			dataSourceFn === (API as any).catalog.fetchCatalogFields
				? {data: null, error: true, loading: false, refetch}
				: {data: [], error: false, loading: false}
		);

		renderPage();

		expect(
			screen.getByText('An unexpected error occurred.')
		).toBeInTheDocument();
		expect(screen.queryByText('Stage Configuration')).toBeNull();
		expect(mockDispatch).toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', {name: 'Reload'}));

		expect(refetch).toHaveBeenCalled();
	});
});
