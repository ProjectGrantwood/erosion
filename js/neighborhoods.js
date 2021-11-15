function getNeighborhood(id){
    let neighborhood;
    switch (id){
        case 'moore': 
            neighborhood = [
                [0,  -1],
                [1,  -1],
                [1,   0],
                [1,   1],
                [0,   1],
                [-1,  1],
                [-1,  0],
                [-1, -1]
            ];
            break;
        case 'von neumann':
            neighborhood = [
                [0, -1],
	        [1,  0],
                [0,  1],
                [-1, 0]
            ];
            break;
        case 'von neumann diagonal':
            neighborhood = [
                [1,  -1],
                [1,   1],
                [-1,  1],
                [-1, -1]
            ];
            break;
        case 'moore oblique': 
            neighborhood = [
                [-1, -2],
                [1,  -2],
                [2,  -1],
                [2,   1],
                [1,   2],
                [-1,  2],
                [-2,  1],
                [-2, -1]
            ];
            break;
    }
    return neighborhood;
}
