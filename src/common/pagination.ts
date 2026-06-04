/**
 * Calculates the pagination of records
 *
 * @param pageNumber
 * @param itemsPerPage
 * @returns
 */
export const getSkipAndTake = (pageNumber: number, itemsPerPage: number): {
	skip: number,
	take: number,
} => {
	if (pageNumber === undefined || pageNumber <= 0) {
		pageNumber = 1;
	}

	if (itemsPerPage === undefined || itemsPerPage <= 0 || itemsPerPage > 24) {
		itemsPerPage = 24;
	}

	return {
		skip: (pageNumber * itemsPerPage) - itemsPerPage,
		take: itemsPerPage,
	};
};
