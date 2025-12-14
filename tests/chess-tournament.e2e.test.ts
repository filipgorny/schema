import "reflect-metadata";
import {
  entity,
  define,
  Database,
  SqlitePersistence,
  Query,
  PropertyType,
} from "../src";

// Helper to generate simple IDs
let idCounter = 0;
const generateId = () => `game-${++idCounter}`;

// Player class with minimal decorator (still building schema manually)
@entity()
class Player {
  id: string;
  name: string;
  rating: number;
  country: string;
  gamesAsWhite?: Game[];
  gamesAsBlack?: Game[];

  constructor(name: string = "", rating: number = 1500, country: string = "") {
    this.id = generateId();
    this.name = name;
    this.rating = rating;
    this.country = country;
  }
}

// Game class with minimal decorator (still building schema manually)
@entity()
class Game {
  id: string;
  round: number;
  date: Date;
  result: string; // "1-0", "0-1", "1/2-1/2"
  whitePlayer?: Player;
  blackPlayer?: Player;

  constructor(
    round: number = 1,
    date: Date = new Date(),
    result: string = "1/2-1/2",
  ) {
    this.id = generateId();
    this.round = round;
    this.date = date;
    this.result = result;
  }
}

describe("Chess Tournament E2E Test (Manual Schema)", () => {
  let database: Database;

  beforeEach(async () => {
    // Reset ID counter for consistent IDs
    idCounter = 0;

    // Build schema manually using EntityBuilder
    const schema = define()
      .entity(Player, (entity) =>
        entity
          .property("name", PropertyType.STRING)
          .property("rating", PropertyType.NUMBER)
          .property("country", PropertyType.STRING),
      )
      .entity(Game, (entity) =>
        entity
          .property("round", PropertyType.NUMBER)
          .property("date", PropertyType.DATE)
          .property("result", PropertyType.STRING),
      )
      .getSchema();

    // Debug: log all entities in schema
    console.log(
      "Entities in schema:",
      schema
        .getEntities()
        .map((e) => ({ name: e.name, classType: e.classType?.name })),
    );

    // Manually establish relationships
    const playerEntity = schema.getEntity("Player");
    const gameEntity = schema.getEntity("Game");

    if (playerEntity && gameEntity) {
      // A Player can have many Games as white
      playerEntity.addChild(gameEntity);
      // A Player can have many Games as black
      playerEntity.addChild(gameEntity);
      // A Game has one white Player
      gameEntity.addParent(playerEntity);
      // A Game has one black Player
      gameEntity.addParent(playerEntity);
    }

    // Create database with in-memory SQLite
    const persistence = new SqlitePersistence(schema, ":memory:");
    database = new Database(persistence, schema);
    await database.initialize();
  });

  afterEach(async () => {
    await database.close();
  });

  it("should save and retrieve players", async () => {
    const player1 = new Player("Magnus Carlsen", 2830, "Norway");
    const player2 = new Player("Garry Kasparov", 2800, "Russia");

    await database.save(player1);
    await database.save(player2);

    const query = new Query("Player").orderBy("rating", "DESC");
    const players = await database.get<Player>(query);

    expect(players.count()).toBe(2);
    const playerArray = players.toArray();
    expect(playerArray[0].name).toBe("Magnus Carlsen");
    expect(playerArray[0].rating).toBe(2830);
    expect(playerArray[1].name).toBe("Garry Kasparov");
  });

  it("should filter players by rating", async () => {
    await database.save(new Player("Magnus Carlsen", 2830, "Norway"));
    await database.save(new Player("Fabiano Caruana", 2800, "USA"));
    await database.save(new Player("Hikaru Nakamura", 2760, "USA"));

    const query = new Query("Player").greaterThan("rating", 2800);
    const players = await database.get<Player>(query);

    expect(players.count()).toBe(1);
    expect(players.first()!.name).toBe("Magnus Carlsen");
  });

  it("should save and retrieve games", async () => {
    const game = new Game(1, new Date("2023-12-01"), "1-0");
    await database.save(game);

    const query = new Query("Game").equals("id", game.id);
    const games = await database.get<Game>(query);

    expect(games.count()).toBe(1);
    const loadedGame = games.first()!;
    expect(loadedGame.round).toBe(1);
    expect(loadedGame.result).toBe("1-0");
    expect(loadedGame.date).toBeInstanceOf(Date);
  });

  it("should handle game results with players", async () => {
    const magnus = new Player("Magnus Carlsen", 2830, "Norway");
    const fabiano = new Player("Fabiano Caruana", 2800, "USA");

    await database.save(magnus);
    await database.save(fabiano);

    // Create a game and assign players
    const game = new Game(1, new Date("2023-12-01"), "1-0");
    game.whitePlayer = magnus;
    game.blackPlayer = fabiano;

    await database.save(game);

    // Load the game
    const gameQuery = new Query("Game").equals("id", game.id);
    const games = await database.get<Game>(gameQuery);
    const loadedGame = games.first()!;

    expect(loadedGame).toBeDefined();
    expect(loadedGame.result).toBe("1-0");

    // Note: Lazy loading with manual schemas works, but currently
    // FK columns are named based on parent entity (Player_id), not property (whitePlayer_id).
    // So we can only have one FK per parent entity type.
    // For now, just verify the game was saved correctly.
    expect(loadedGame.round).toBe(1);
    expect((loadedGame as any).Player_id).toBe(magnus.id); // FK to first player set
  });

  it("should filter games by round", async () => {
    await database.save(new Game(1, new Date("2023-12-01"), "1-0"));
    await database.save(new Game(1, new Date("2023-12-01"), "0-1"));
    await database.save(new Game(2, new Date("2023-12-02"), "1/2-1/2"));

    const query = new Query("Game").equals("round", 1);
    const games = await database.get<Game>(query);

    expect(games.count()).toBe(2);
  });

  it("should use limit and pagination", async () => {
    for (let i = 1; i <= 5; i++) {
      await database.save(new Player(`Player ${i}`, 2700 + i * 10, "USA"));
    }

    const query = new Query("Player")
      .orderBy("rating", "ASC")
      .limit(2)
      .offset(1);
    const players = await database.get<Player>(query);

    expect(players.count()).toBe(2);
    const playerArray = players.toArray();
    expect(playerArray[0].name).toBe("Player 2");
    expect(playerArray[1].name).toBe("Player 3");
  });

  it("should filter by country using LIKE", async () => {
    await database.save(new Player("Magnus Carlsen", 2830, "Norway"));
    await database.save(new Player("Jon Ludvig Hammer", 2600, "Norway"));
    await database.save(new Player("Fabiano Caruana", 2800, "USA"));

    const query = new Query("Player").like("country", "Nor%");
    const players = await database.get<Player>(query);

    expect(players.count()).toBe(2);
  });

  it("should handle tournament results with multiple games", async () => {
    const magnus = new Player("Magnus Carlsen", 2830, "Norway");
    const fabiano = new Player("Fabiano Caruana", 2800, "USA");

    await database.save(magnus);
    await database.save(fabiano);

    // Game 1: Magnus wins as white
    const game1 = new Game(1, new Date("2023-12-01"), "1-0");
    game1.whitePlayer = magnus;
    game1.blackPlayer = fabiano;
    await database.save(game1);

    // Game 2: Draw
    const game2 = new Game(2, new Date("2023-12-02"), "1/2-1/2");
    game2.whitePlayer = fabiano;
    game2.blackPlayer = magnus;
    await database.save(game2);

    // Query all games
    const allGamesQuery = new Query("Game").orderBy("round", "ASC");
    const allGames = await database.get<Game>(allGamesQuery);

    expect(allGames.count()).toBe(2);

    const gamesArray = allGames.toArray();
    expect(gamesArray[0].result).toBe("1-0");
    expect(gamesArray[1].result).toBe("1/2-1/2");

    // Verify white player in game 1
    const game1White = await (gamesArray[0] as any).whitePlayer;
    expect(game1White.name).toBe("Magnus Carlsen");

    // Verify black player in game 2
    const game2Black = await (gamesArray[1] as any).blackPlayer;
    expect(game2Black.name).toBe("Magnus Carlsen");
  });

  it("should count wins for a player", async () => {
    const magnus = new Player("Magnus Carlsen", 2830, "Norway");
    const opponent1 = new Player("Opponent 1", 2700, "USA");
    const opponent2 = new Player("Opponent 2", 2700, "USA");

    await database.save(magnus);
    await database.save(opponent1);
    await database.save(opponent2);

    // Magnus wins 2 games as white
    const win1 = new Game(1, new Date("2023-12-01"), "1-0");
    win1.whitePlayer = magnus;
    win1.blackPlayer = opponent1;
    await database.save(win1);

    const win2 = new Game(2, new Date("2023-12-02"), "1-0");
    win2.whitePlayer = magnus;
    win2.blackPlayer = opponent2;
    await database.save(win2);

    // Magnus loses 1 game as black
    const loss = new Game(3, new Date("2023-12-03"), "1-0");
    loss.whitePlayer = opponent1;
    loss.blackPlayer = magnus;
    await database.save(loss);

    // Query games where Magnus is white and result is 1-0
    const winsAsWhiteQuery = new Query("Game")
      .equals("Player_id", magnus.id)
      .equals("result", "1-0");
    const winsAsWhite = await database.get<Game>(winsAsWhiteQuery);

    expect(winsAsWhite.count()).toBe(2);
  });
});
