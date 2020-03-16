import { _get, _searchinside } from '../src/tabstacks/lib/util.js';

const deepObject = {
    a: {
        b: {
            c: {
                d: {
                    e: {
                        f: {
                            g: {
                                h: {
                                    i: {
                                        j: {
                                            k: {
                                                l: {
                                                    m: {
                                                        n: 'You made it to "n"',
                                                        o: function() {},
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

const Seinfeld = {
    title: 'Seinfeld',
    cast: [
        {
            id: 'abcdef',
            fname: 'George',
            lname: 'Costanza',
            description: "George is Jerry's scheming and cowardly neighbor",
        },
        {
            id: 'fedcab',
            fname: 'Cosmo',
            lname: 'Kramer',
            description: "Kramer is Jerry's oddball neighbor",
        },
        {
            id: 'vbnyte',
            fname: 'Elaine',
            lname: 'Benes',
            description:
                "Elaine is Jerry's one time love interest turned friend",
        },
        {
            id: 'jseinf',
            fname: 'Jerry',
            lname: 'Seinfeld',
            description: 'Jerry is a NYC comedian',
        },
        {
            id: 'nwmnab',
            fname: '',
            lname: 'Newman',
            description: "Newman is Jerry's arch nemesis",
        },
    ],
    show: {
        format: 'sitcom',
        location: 'New York City',
        studio_audience: true,
        duration: {
            begin: 1989,
            end: 1998,
            episodes: 173,
        },
    },
};

describe('functions', () => {
    it('Validate _get function', () => {
        expect(_get).toBeDefined();
        expect(_get(Seinfeld, 'title')).toBe('Seinfeld');
        expect(_get(Seinfeld, 'show.format')).toBe('sitcom');
        expect(_get(Seinfeld, 'show.duration.end')).toEqual(1998);
        expect(_get(Seinfeld, 'show.studio_audience')).toBe(true);
        expect(_get(deepObject, 'a.b.c.d.e.f.g.h.i.j.k.l')).toEqual(
            deepObject.a.b.c.d.e.f.g.h.i.j.k.l
        );
        // negative cases
        expect(_get(Seinfeld, 'does.not.exist')).toBeNull();
        expect(_get({}, '')).toBeNull();
    });

    it('Validate search algorithm', () => {
        const res1 = _searchinside(Seinfeld.cast, 'neighbor', [
            'fname',
            'lname',
            'description',
        ]);
        const res2 = _searchinside(Seinfeld.cast, 'newman', ['lname']);
        const res3 = _searchinside(Seinfeld.cast, "jerry's", ['description']);
        const res4 = _searchinside(Seinfeld.cast, 'neighbor oddball', [
            'description',
        ]);
        expect(res1).toBeDefined();
        expect(res1.length).toEqual(2);
        expect(res2.length).toEqual(1);
        expect(res3.length).toEqual(4);
        expect(res4.length).toEqual(1);
    });
});
