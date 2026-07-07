/**
 * Database Indexing Strategies
 * Index definitions and optimization recommendations
 */

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique?: boolean;
  partial?: string; // Partial index condition
  description: string;
}

/**
 * Recommended indexes for optimal performance
 */
export const recommendedIndexes: IndexDefinition[] = [
  // Users table
  {
    name: 'idx_users_email',
    table: 'users',
    columns: ['email'],
    unique: true,
    description: 'Email lookup for authentication'
  },
  {
    name: 'idx_users_role',
    table: 'users',
    columns: ['role'],
    description: 'Filter by user role'
  },
  {
    name: 'idx_users_created_at',
    table: 'users',
    columns: ['created_at'],
    description: 'Sort users by creation date'
  },

  // Badges table
  {
    name: 'idx_badges_category',
    table: 'badges',
    columns: ['category'],
    description: 'Filter badges by category'
  },
  {
    name: 'idx_badges_tier',
    table: 'badges',
    columns: ['tier'],
    description: 'Filter badges by tier'
  },

  // User badges
  {
    name: 'idx_user_badges_user_id',
    table: 'user_badges',
    columns: ['user_id'],
    description: 'Get all badges for a user'
  },
  {
    name: 'idx_user_badges_badge_id',
    table: 'user_badges',
    columns: ['badge_id'],
    description: 'Get all users with a badge'
  },
  {
    name: 'idx_user_badges_earned_at',
    table: 'user_badges',
    columns: ['earned_at'],
    description: 'Get badges earned in time range'
  },
  {
    name: 'idx_user_badges_composite',
    table: 'user_badges',
    columns: ['user_id', 'badge_id'],
    unique: true,
    description: 'Prevent duplicate user-badge pairs'
  },

  // Points table
  {
    name: 'idx_points_user_id',
    table: 'points',
    columns: ['user_id'],
    description: 'Get all points for a user'
  },
  {
    name: 'idx_points_created_at',
    table: 'points',
    columns: ['created_at'],
    description: 'Get points by date range'
  },
  {
    name: 'idx_points_activity_type',
    table: 'points',
    columns: ['activity_type'],
    description: 'Get points by activity type'
  },
  {
    name: 'idx_points_composite',
    table: 'points',
    columns: ['user_id', 'created_at'],
    description: 'Optimize user points time range queries'
  },

  // Leaderboard (materialized view)
  {
    name: 'idx_leaderboard_points',
    table: 'leaderboard',
    columns: ['total_points'],
    description: 'Sort by points for leaderboard'
  },

  // Performance indexes
  {
    name: 'idx_users_deleted_at',
    table: 'users',
    columns: ['deleted_at'],
    partial: 'deleted_at IS NULL',
    description: 'Only active users (soft delete)'
  },
  {
    name: 'idx_points_by_date_range',
    table: 'points',
    columns: ['user_id', 'created_at', 'points'],
    description: 'Covering index for user points by date'
  }
];

/**
 * SQL to create all recommended indexes
 */
export function generateCreateIndexSQL(): string[] {
  return recommendedIndexes.map((index) => {
    let sql = `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns.join(', ')})`;

    if (index.partial) {
      sql += ` WHERE ${index.partial}`;
    }

    sql += ';';
    return sql;
  });
}

/**
 * Get index creation statements
 */
export function getIndexSQL(tableName?: string): string {
  const indexes = tableName
    ? recommendedIndexes.filter((i) => i.table === tableName)
    : recommendedIndexes;

  return indexes.map((index) => generateCreateIndexSQL()).flat().join('\n');
}

/**
 * Index optimization recommendations
 */
export const indexOptimizations = {
  selectOptimization: `
    -- Use covering indexes to avoid table lookups
    SELECT user_id, total_points
    FROM leaderboard
    ORDER BY total_points DESC
    LIMIT 10;
  `,

  joinOptimization: `
    -- Ensure foreign key columns are indexed
    SELECT u.*, ub.badge_id
    FROM users u
    INNER JOIN user_badges ub ON u.id = ub.user_id
    WHERE ub.earned_at > NOW() - INTERVAL '7 days';
  `,

  timeRangeOptimization: `
    -- Use composite index for time range queries
    SELECT * FROM points
    WHERE user_id = $1
    AND created_at BETWEEN $2 AND $3
    ORDER BY created_at DESC;
  `,

  aggregationOptimization: `
    -- Materialize expensive aggregations
    SELECT
      user_id,
      SUM(points) as total_points,
      COUNT(*) as point_count,
      MAX(created_at) as last_updated
    FROM points
    GROUP BY user_id;
  `
};

/**
 * Database statistics for monitoring
 */
export interface IndexStats {
  indexName: string;
  table: string;
  sizeBytes: number;
  usageCount: number;
  lastUsed?: string;
  recommendedAction?: string;
}

/**
 * Get monitoring queries for indexes
 */
export function getIndexMonitoringQueries(): Record<string, string> {
  return {
    missingIndexes: `
      -- Find queries that could benefit from indexes
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY abs(correlation) DESC;
    `,

    unusedIndexes: `
      -- Find indexes that are rarely used
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_scan < 50
      ORDER BY idx_scan ASC;
    `,

    indexSize: `
      -- Check index sizes
      SELECT
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
      FROM pg_stat_user_indexes
      ORDER BY pg_relation_size(indexrelid) DESC;
    `,

    tableSize: `
      -- Check table and index sizes
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY pg_total_relation_size(tablename::regclass) DESC;
    `,

    sequentialScans: `
      -- Find tables with excessive sequential scans
      SELECT
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan
      FROM pg_stat_user_tables
      WHERE seq_scan > 1000
      ORDER BY seq_scan DESC;
    `
  };
}

export default {
  recommendedIndexes,
  generateCreateIndexSQL,
  getIndexSQL,
  indexOptimizations,
  getIndexMonitoringQueries
};
