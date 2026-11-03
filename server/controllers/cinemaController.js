import { getDb } from '../database/connection.js';

// Curated up-to-date theatrical releases with full details, high-res posters, trailers, and cast
const FALLBACK_THEATRICAL_MOVIES = [
  {
    id: 101,
    tmdb_id: 693134,
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters.',
    overview:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    poster_path: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg',
    release_date: '2024-03-01',
    runtime: '166 min',
    vote_average: 8.5,
    vote_count: 5420,
    certification: 'PG-13',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler', 'Florence Pugh'],
    trailer_url: 'https://www.youtube.com/embed/Way9Dexny3w',
    box_office: '$714.4 Million',
    status: 'In Theatres & Digital',
  },
  {
    id: 102,
    tmdb_id: 533535,
    title: 'Deadpool & Wolverine',
    tagline: 'Come together.',
    overview:
      'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary Deadpool behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit up again with an even more reluctant Wolverine.',
    poster_path: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB1jv822.jpg',
    release_date: '2024-07-26',
    runtime: '128 min',
    vote_average: 7.8,
    vote_count: 4890,
    certification: 'R',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen', 'Dafne Keen'],
    trailer_url: 'https://www.youtube.com/embed/73_1biulkYk',
    box_office: '$1.338 Billion',
    status: 'Box Office Hit',
  },
  {
    id: 103,
    tmdb_id: 558449,
    title: 'Gladiator II',
    tagline: 'What we do in life echoes in eternity.',
    overview:
      'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist. With rage in his heart and the future of the Empire at stake, Lucius must look to his past to find strength.',
    poster_path: 'https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRHbtO3GoxVq8.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/euYIwmwkmz95mnXvufEmbL69ovr.jpg',
    release_date: '2024-11-22',
    runtime: '148 min',
    vote_average: 7.9,
    vote_count: 2150,
    certification: 'R',
    genres: ['Action', 'Adventure', 'Drama', 'History'],
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen', 'Joseph Quinn'],
    trailer_url: 'https://www.youtube.com/embed/4rgYUipGJNo',
    box_office: '$462 Million',
    status: 'Now In Theatres',
  },
  {
    id: 104,
    tmdb_id: 402431,
    title: 'Wicked',
    tagline: 'Discover the untold story of the witches of Oz.',
    overview:
      'Elphaba, an ostracized but passionate young woman born with green skin, and Glinda, a privileged and bubbly popular girl, meet as students at Shiz University in the Land of Oz and forge an unlikely but profound friendship.',
    poster_path: 'https://image.tmdb.org/t/p/w780/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/uKb22E5ww9bbt4lrUnPq3AHBa7T.jpg',
    release_date: '2024-11-20',
    runtime: '160 min',
    vote_average: 8.2,
    vote_count: 1820,
    certification: 'PG',
    genres: ['Fantasy', 'Musical', 'Romance'],
    director: 'Jon M. Chu',
    cast: ['Cynthia Erivo', 'Ariana Grande', 'Jonathan Bailey', 'Jeff Goldblum', 'Michelle Yeoh'],
    trailer_url: 'https://www.youtube.com/embed/6COmYeLsz4c',
    box_office: '$720 Million',
    status: 'Now In Theatres',
  },
  {
    id: 105,
    tmdb_id: 1241982,
    title: 'Moana 2',
    tagline: 'The ocean is calling them back.',
    overview:
      'After receiving an unexpected call from her wayfinding ancestors, Moana journeys to the far seas of Oceania and into dangerous, long-lost waters for an adventure unlike anything she has ever faced.',
    poster_path: 'https://image.tmdb.org/t/p/w780/aLVkiINNObeVNsZ5vT4plSRwL9K.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/tElnmtQ6yz1PjN1kePNl8yMSb59.jpg',
    release_date: '2024-11-27',
    runtime: '100 min',
    vote_average: 7.4,
    vote_count: 1350,
    certification: 'PG',
    genres: ['Animation', 'Adventure', 'Family', 'Music'],
    director: 'David Derrick Jr.',
    cast: ["Auli'i Cravalho", 'Dwayne Johnson', 'Alan Tudyk', 'Temuera Morrison'],
    trailer_url: 'https://www.youtube.com/embed/hDZ7y8RP5HE',
    box_office: '$1.04 Billion',
    status: 'Now In Theatres',
  },
  {
    id: 106,
    tmdb_id: 426063,
    title: 'Nosferatu',
    tagline: 'Death is no escape.',
    overview:
      'A gothic tale of obsession between a haunted young woman in 19th-century Germany and the ancient Transylvanian vampire who stalks her, bringing untold horror with him.',
    poster_path: 'https://image.tmdb.org/t/p/w780/5G2bKdgmF7oMgD9fvRPZ9O0DsTG.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/4cp40Ah5nN3vGL2u34BPh989LqG.jpg',
    release_date: '2024-12-25',
    runtime: '132 min',
    vote_average: 7.7,
    vote_count: 1100,
    certification: 'R',
    genres: ['Horror', 'Mystery', 'Fantasy'],
    director: 'Robert Eggers',
    cast: ['Bill Skarsgård', 'Lily-Rose Depp', 'Nicholas Hoult', 'Willem Dafoe', 'Aaron Taylor-Johnson'],
    trailer_url: 'https://www.youtube.com/embed/nulvWqYUM8k',
    box_office: '$180 Million',
    status: 'Now In Theatres',
  },
  {
    id: 107,
    tmdb_id: 1022789,
    title: 'Inside Out 2',
    tagline: 'Make room for new emotions.',
    overview:
      "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust aren't sure how to feel when Anxiety shows up with Envy, Ennui, and Embarrassment.",
    poster_path: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/stKGOm8ffToIgIlIsSmDhFuq29q.jpg',
    release_date: '2024-06-14',
    runtime: '96 min',
    vote_average: 8.0,
    vote_count: 5120,
    certification: 'PG',
    genres: ['Animation', 'Family', 'Comedy', 'Adventure'],
    director: 'Kelsey Mann',
    cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman', 'Liza Lapira', 'Tony Hale'],
    trailer_url: 'https://www.youtube.com/embed/LEjhY15eCx0',
    box_office: '$1.698 Billion',
    status: 'Blockbuster',
  },
  {
    id: 108,
    tmdb_id: 945961,
    title: 'Alien: Romulus',
    tagline: 'In space no one can hear you scream.',
    overview:
      'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
    poster_path: 'https://image.tmdb.org/t/p/w780/b33nnKl1GSFbao8l3urDDgo402F.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg',
    release_date: '2024-08-16',
    runtime: '119 min',
    vote_average: 7.6,
    vote_count: 3200,
    certification: 'R',
    genres: ['Sci-Fi', 'Horror', 'Thriller'],
    director: 'Fede Álvarez',
    cast: ['Cailee Spaeny', 'David Jonsson', 'Archie Renaux', 'Isabela Merced', 'Spike Fearn'],
    trailer_url: 'https://www.youtube.com/embed/x0XDEhP4MQs',
    box_office: '$350 Million',
    status: 'In Theatres',
  },
  {
    id: 109,
    tmdb_id: 917496,
    title: 'Beetlejuice Beetlejuice',
    tagline: 'The juice is loose.',
    overview:
      'After a family tragedy, three generations of the Deetz family return home to Winter River. Still haunted by Beetlejuice, Lydia\'s life is turned upside down when her teenage daughter accidentally opens the portal to the Afterlife.',
    poster_path: 'https://image.tmdb.org/t/p/w780/kKgQzkUCUm0meqZGFRVoMmIkQ2I.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/1wP1phHo2CROOqzv7AzUNTB94Zz.jpg',
    release_date: '2024-09-06',
    runtime: '105 min',
    vote_average: 7.2,
    vote_count: 2200,
    certification: 'PG-13',
    genres: ['Comedy', 'Fantasy', 'Horror'],
    director: 'Tim Burton',
    cast: ['Michael Keaton', 'Winona Ryder', 'Jenna Ortega', 'Catherine O’Hara', 'Willem Dafoe'],
    trailer_url: 'https://www.youtube.com/embed/CoZqL9N6Rx4',
    box_office: '$451 Million',
    status: 'Box Office Hit',
  },
  {
    id: 110,
    tmdb_id: 718821,
    title: 'Twisters',
    tagline: 'If you feel it, chase it.',
    overview:
      'As storm season intensifies, the paths of former storm chaser Kate Cooper and reckless social-media superstar Tyler Owens collide when unprecedented phenomena are unleashed across Oklahoma.',
    poster_path: 'https://image.tmdb.org/t/p/w780/pjnD08FlMAIXsfOLKQbvmO0f0MD.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/581JR99itkZ0Xeq7nMggumvXfH2.jpg',
    release_date: '2024-07-19',
    runtime: '122 min',
    vote_average: 7.1,
    vote_count: 1980,
    certification: 'PG-13',
    genres: ['Action', 'Adventure', 'Thriller'],
    director: 'Lee Isaac Chung',
    cast: ['Daisy Edgar-Jones', 'Glen Powell', 'Anthony Ramos', 'Brandon Perea', 'Maura Tierney'],
    trailer_url: 'https://www.youtube.com/embed/JduJ9gN9H34',
    box_office: '$372 Million',
    status: 'In Theatres',
  },
  {
    id: 111,
    tmdb_id: 786892,
    title: 'Furiosa: A Mad Max Saga',
    tagline: 'Forged in fire.',
    overview:
      'As the world fell, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great Biker Horde led by the Warlord Dementus. Sweeping through the Wasteland, they come across the Citadel presided over by The Immortan Joe.',
    poster_path: 'https://image.tmdb.org/t/p/w780/iADOJ8Zymht2JPMoy3R7xUMZ51f.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/wNAhuOZ3Zf84jCI5TeTVrwUm4tw.jpg',
    release_date: '2024-05-24',
    runtime: '148 min',
    vote_average: 7.8,
    vote_count: 3600,
    certification: 'R',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    director: 'George Miller',
    cast: ['Anya Taylor-Joy', 'Chris Hemsworth', 'Tom Burke', 'Lachy Hulme'],
    trailer_url: 'https://www.youtube.com/embed/XJMuhwVlca4',
    box_office: '$173 Million',
    status: 'Premier Selection',
  },
  {
    id: 112,
    tmdb_id: 763215,
    title: 'Damsel',
    tagline: 'This is not a fairy tale.',
    overview:
      'A dutiful damsel agrees to marry a handsome prince, only to find the royal family has recruited her as a sacrifice to repay an ancient debt. Thrown into a cave with a fire-breathing dragon, she must rely on her wits and will to survive.',
    poster_path: 'https://image.tmdb.org/t/p/w780/AgHbB9D4z9iCvKNJwUFurqKnSX1.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/4woSOUD0equAYzvwhWBHIJDCM88.jpg',
    release_date: '2024-03-08',
    runtime: '110 min',
    vote_average: 7.3,
    vote_count: 2450,
    certification: 'PG-13',
    genres: ['Fantasy', 'Action', 'Adventure'],
    director: 'Juan Carlos Fresnadillo',
    cast: ['Millie Bobby Brown', 'Ray Winstone', 'Angela Bassett', 'Nick Robinson', 'Shohreh Aghdashloo'],
    trailer_url: 'https://www.youtube.com/embed/iM150ZWovZM',
    box_office: 'Streaming Premier',
    status: 'Now In Theatres',
  },
];

export const cinemaController = {
  async getInTheatres(req, res) {
    const tmdbKey = process.env.TMDB_API_KEY;
    let movies = [...FALLBACK_THEATRICAL_MOVIES];

    // Optional dynamic TMDB live fetch if key is provided
    if (tmdbKey) {
      try {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbKey}&language=en-US&page=1`
        );
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json();
          if (Array.isArray(tmdbData.results) && tmdbData.results.length > 0) {
            movies = tmdbData.results.map((m) => ({
              id: m.id,
              tmdb_id: m.id,
              title: m.title,
              tagline: m.tagline || '',
              overview: m.overview,
              poster_path: m.poster_path
                ? `https://image.tmdb.org/t/p/w780${m.poster_path}`
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
              backdrop_path: m.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`
                : undefined,
              release_date: m.release_date,
              runtime: '120 min',
              vote_average: Math.round((m.vote_average || 7.5) * 10) / 10,
              vote_count: m.vote_count || 1000,
              certification: 'PG-13',
              genres: ['Action', 'Cinema'],
              director: 'Theatrical Release',
              cast: ['Ensemble Cast'],
              trailer_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + ' trailer')}`,
              box_office: 'Box Office Release',
              status: 'Now In Theatres',
            }));
          }
        }
      } catch (err) {
        console.warn('TMDB fetch failed, falling back to curated list:', err.message);
      }
    }

    // Check cross-reference with our local SQLite movies table
    const db = getDb();
    const localMovies = db.prepare("SELECT id, title, slug, poster, year FROM movies WHERE status = 'published'").all();

    const enrichedMovies = movies.map((movie) => {
      const match = localMovies.find(
        (local) =>
          local.title.toLowerCase().trim() === movie.title.toLowerCase().trim() ||
          movie.title.toLowerCase().includes(local.title.toLowerCase())
      );

      return {
        ...movie,
        is_on_free2watch: Boolean(match),
        free2watch_slug: match ? match.slug : null,
      };
    });

    res.json({
      items: enrichedMovies,
      source: tmdbKey ? 'tmdb_live' : 'curated_theatrical',
      total: enrichedMovies.length,
      updated_at: new Date().toISOString(),
    });
  },

  async getMovieDetails(req, res) {
    const { id } = req.params;
    const movie = FALLBACK_THEATRICAL_MOVIES.find((m) => String(m.id) === id || String(m.tmdb_id) === id);

    if (!movie) {
      return res.status(404).json({ error: 'Cinema title not found.' });
    }

    // Check if available on FREE2WATCH
    const db = getDb();
    const match = db
      .prepare('SELECT id, title, slug, poster FROM movies WHERE LOWER(title) = ?')
      .get(movie.title.toLowerCase());

    res.json({
      movie: {
        ...movie,
        is_on_free2watch: Boolean(match),
        free2watch_slug: match ? match.slug : null,
      },
    });
  },
};
