
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Group
 * 
 */
export type Group = $Result.DefaultSelection<Prisma.$GroupPayload>
/**
 * Model ProjectStatus
 * 
 */
export type ProjectStatus = $Result.DefaultSelection<Prisma.$ProjectStatusPayload>
/**
 * Model Project
 * 
 */
export type Project = $Result.DefaultSelection<Prisma.$ProjectPayload>
/**
 * Model Feature
 * 
 */
export type Feature = $Result.DefaultSelection<Prisma.$FeaturePayload>
/**
 * Model ProjectAssignee
 * 
 */
export type ProjectAssignee = $Result.DefaultSelection<Prisma.$ProjectAssigneePayload>
/**
 * Model TimesheetEntry
 * 
 */
export type TimesheetEntry = $Result.DefaultSelection<Prisma.$TimesheetEntryPayload>
/**
 * Model Overtime
 * 
 */
export type Overtime = $Result.DefaultSelection<Prisma.$OvertimePayload>
/**
 * Model OvertimeDescription
 * 
 */
export type OvertimeDescription = $Result.DefaultSelection<Prisma.$OvertimeDescriptionPayload>
/**
 * Model ApiLog
 * 
 */
export type ApiLog = $Result.DefaultSelection<Prisma.$ApiLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ProjectAssetCaptureType: {
  CAPTUREABLE: 'CAPTUREABLE',
  UN_CAPTUREABLE: 'UN_CAPTUREABLE'
};

export type ProjectAssetCaptureType = (typeof ProjectAssetCaptureType)[keyof typeof ProjectAssetCaptureType]

}

export type ProjectAssetCaptureType = $Enums.ProjectAssetCaptureType

export const ProjectAssetCaptureType: typeof $Enums.ProjectAssetCaptureType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Groups
 * const groups = await prisma.group.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Groups
   * const groups = await prisma.group.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.group`: Exposes CRUD operations for the **Group** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Groups
    * const groups = await prisma.group.findMany()
    * ```
    */
  get group(): Prisma.GroupDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.projectStatus`: Exposes CRUD operations for the **ProjectStatus** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProjectStatuses
    * const projectStatuses = await prisma.projectStatus.findMany()
    * ```
    */
  get projectStatus(): Prisma.ProjectStatusDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.project`: Exposes CRUD operations for the **Project** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Projects
    * const projects = await prisma.project.findMany()
    * ```
    */
  get project(): Prisma.ProjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.feature`: Exposes CRUD operations for the **Feature** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Features
    * const features = await prisma.feature.findMany()
    * ```
    */
  get feature(): Prisma.FeatureDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.projectAssignee`: Exposes CRUD operations for the **ProjectAssignee** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProjectAssignees
    * const projectAssignees = await prisma.projectAssignee.findMany()
    * ```
    */
  get projectAssignee(): Prisma.ProjectAssigneeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.timesheetEntry`: Exposes CRUD operations for the **TimesheetEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TimesheetEntries
    * const timesheetEntries = await prisma.timesheetEntry.findMany()
    * ```
    */
  get timesheetEntry(): Prisma.TimesheetEntryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.overtime`: Exposes CRUD operations for the **Overtime** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Overtimes
    * const overtimes = await prisma.overtime.findMany()
    * ```
    */
  get overtime(): Prisma.OvertimeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.overtimeDescription`: Exposes CRUD operations for the **OvertimeDescription** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OvertimeDescriptions
    * const overtimeDescriptions = await prisma.overtimeDescription.findMany()
    * ```
    */
  get overtimeDescription(): Prisma.OvertimeDescriptionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.apiLog`: Exposes CRUD operations for the **ApiLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ApiLogs
    * const apiLogs = await prisma.apiLog.findMany()
    * ```
    */
  get apiLog(): Prisma.ApiLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.0
   * Query Engine version: 2ba551f319ab1df4bc874a89965d8b3641056773
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Group: 'Group',
    ProjectStatus: 'ProjectStatus',
    Project: 'Project',
    Feature: 'Feature',
    ProjectAssignee: 'ProjectAssignee',
    TimesheetEntry: 'TimesheetEntry',
    Overtime: 'Overtime',
    OvertimeDescription: 'OvertimeDescription',
    ApiLog: 'ApiLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    timesheet?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "group" | "projectStatus" | "project" | "feature" | "projectAssignee" | "timesheetEntry" | "overtime" | "overtimeDescription" | "apiLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Group: {
        payload: Prisma.$GroupPayload<ExtArgs>
        fields: Prisma.GroupFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GroupFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GroupFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          findFirst: {
            args: Prisma.GroupFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GroupFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          findMany: {
            args: Prisma.GroupFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>[]
          }
          create: {
            args: Prisma.GroupCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          createMany: {
            args: Prisma.GroupCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GroupCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>[]
          }
          delete: {
            args: Prisma.GroupDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          update: {
            args: Prisma.GroupUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          deleteMany: {
            args: Prisma.GroupDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GroupUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GroupUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>[]
          }
          upsert: {
            args: Prisma.GroupUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          aggregate: {
            args: Prisma.GroupAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGroup>
          }
          groupBy: {
            args: Prisma.GroupGroupByArgs<ExtArgs>
            result: $Utils.Optional<GroupGroupByOutputType>[]
          }
          count: {
            args: Prisma.GroupCountArgs<ExtArgs>
            result: $Utils.Optional<GroupCountAggregateOutputType> | number
          }
        }
      }
      ProjectStatus: {
        payload: Prisma.$ProjectStatusPayload<ExtArgs>
        fields: Prisma.ProjectStatusFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProjectStatusFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProjectStatusFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>
          }
          findFirst: {
            args: Prisma.ProjectStatusFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProjectStatusFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>
          }
          findMany: {
            args: Prisma.ProjectStatusFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>[]
          }
          create: {
            args: Prisma.ProjectStatusCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>
          }
          createMany: {
            args: Prisma.ProjectStatusCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProjectStatusCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>[]
          }
          delete: {
            args: Prisma.ProjectStatusDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>
          }
          update: {
            args: Prisma.ProjectStatusUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>
          }
          deleteMany: {
            args: Prisma.ProjectStatusDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProjectStatusUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProjectStatusUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>[]
          }
          upsert: {
            args: Prisma.ProjectStatusUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectStatusPayload>
          }
          aggregate: {
            args: Prisma.ProjectStatusAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProjectStatus>
          }
          groupBy: {
            args: Prisma.ProjectStatusGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProjectStatusGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProjectStatusCountArgs<ExtArgs>
            result: $Utils.Optional<ProjectStatusCountAggregateOutputType> | number
          }
        }
      }
      Project: {
        payload: Prisma.$ProjectPayload<ExtArgs>
        fields: Prisma.ProjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          findFirst: {
            args: Prisma.ProjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          findMany: {
            args: Prisma.ProjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          create: {
            args: Prisma.ProjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          createMany: {
            args: Prisma.ProjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          delete: {
            args: Prisma.ProjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          update: {
            args: Prisma.ProjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          deleteMany: {
            args: Prisma.ProjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>[]
          }
          upsert: {
            args: Prisma.ProjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectPayload>
          }
          aggregate: {
            args: Prisma.ProjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProject>
          }
          groupBy: {
            args: Prisma.ProjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProjectCountArgs<ExtArgs>
            result: $Utils.Optional<ProjectCountAggregateOutputType> | number
          }
        }
      }
      Feature: {
        payload: Prisma.$FeaturePayload<ExtArgs>
        fields: Prisma.FeatureFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FeatureFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FeatureFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>
          }
          findFirst: {
            args: Prisma.FeatureFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FeatureFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>
          }
          findMany: {
            args: Prisma.FeatureFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>[]
          }
          create: {
            args: Prisma.FeatureCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>
          }
          createMany: {
            args: Prisma.FeatureCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FeatureCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>[]
          }
          delete: {
            args: Prisma.FeatureDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>
          }
          update: {
            args: Prisma.FeatureUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>
          }
          deleteMany: {
            args: Prisma.FeatureDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FeatureUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FeatureUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>[]
          }
          upsert: {
            args: Prisma.FeatureUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeaturePayload>
          }
          aggregate: {
            args: Prisma.FeatureAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFeature>
          }
          groupBy: {
            args: Prisma.FeatureGroupByArgs<ExtArgs>
            result: $Utils.Optional<FeatureGroupByOutputType>[]
          }
          count: {
            args: Prisma.FeatureCountArgs<ExtArgs>
            result: $Utils.Optional<FeatureCountAggregateOutputType> | number
          }
        }
      }
      ProjectAssignee: {
        payload: Prisma.$ProjectAssigneePayload<ExtArgs>
        fields: Prisma.ProjectAssigneeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProjectAssigneeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProjectAssigneeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>
          }
          findFirst: {
            args: Prisma.ProjectAssigneeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProjectAssigneeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>
          }
          findMany: {
            args: Prisma.ProjectAssigneeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>[]
          }
          create: {
            args: Prisma.ProjectAssigneeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>
          }
          createMany: {
            args: Prisma.ProjectAssigneeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProjectAssigneeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>[]
          }
          delete: {
            args: Prisma.ProjectAssigneeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>
          }
          update: {
            args: Prisma.ProjectAssigneeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>
          }
          deleteMany: {
            args: Prisma.ProjectAssigneeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProjectAssigneeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProjectAssigneeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>[]
          }
          upsert: {
            args: Prisma.ProjectAssigneeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProjectAssigneePayload>
          }
          aggregate: {
            args: Prisma.ProjectAssigneeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProjectAssignee>
          }
          groupBy: {
            args: Prisma.ProjectAssigneeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProjectAssigneeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProjectAssigneeCountArgs<ExtArgs>
            result: $Utils.Optional<ProjectAssigneeCountAggregateOutputType> | number
          }
        }
      }
      TimesheetEntry: {
        payload: Prisma.$TimesheetEntryPayload<ExtArgs>
        fields: Prisma.TimesheetEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TimesheetEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TimesheetEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>
          }
          findFirst: {
            args: Prisma.TimesheetEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TimesheetEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>
          }
          findMany: {
            args: Prisma.TimesheetEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>[]
          }
          create: {
            args: Prisma.TimesheetEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>
          }
          createMany: {
            args: Prisma.TimesheetEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TimesheetEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>[]
          }
          delete: {
            args: Prisma.TimesheetEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>
          }
          update: {
            args: Prisma.TimesheetEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>
          }
          deleteMany: {
            args: Prisma.TimesheetEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TimesheetEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TimesheetEntryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>[]
          }
          upsert: {
            args: Prisma.TimesheetEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimesheetEntryPayload>
          }
          aggregate: {
            args: Prisma.TimesheetEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTimesheetEntry>
          }
          groupBy: {
            args: Prisma.TimesheetEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<TimesheetEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.TimesheetEntryCountArgs<ExtArgs>
            result: $Utils.Optional<TimesheetEntryCountAggregateOutputType> | number
          }
        }
      }
      Overtime: {
        payload: Prisma.$OvertimePayload<ExtArgs>
        fields: Prisma.OvertimeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OvertimeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OvertimeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>
          }
          findFirst: {
            args: Prisma.OvertimeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OvertimeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>
          }
          findMany: {
            args: Prisma.OvertimeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>[]
          }
          create: {
            args: Prisma.OvertimeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>
          }
          createMany: {
            args: Prisma.OvertimeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OvertimeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>[]
          }
          delete: {
            args: Prisma.OvertimeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>
          }
          update: {
            args: Prisma.OvertimeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>
          }
          deleteMany: {
            args: Prisma.OvertimeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OvertimeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OvertimeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>[]
          }
          upsert: {
            args: Prisma.OvertimeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimePayload>
          }
          aggregate: {
            args: Prisma.OvertimeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOvertime>
          }
          groupBy: {
            args: Prisma.OvertimeGroupByArgs<ExtArgs>
            result: $Utils.Optional<OvertimeGroupByOutputType>[]
          }
          count: {
            args: Prisma.OvertimeCountArgs<ExtArgs>
            result: $Utils.Optional<OvertimeCountAggregateOutputType> | number
          }
        }
      }
      OvertimeDescription: {
        payload: Prisma.$OvertimeDescriptionPayload<ExtArgs>
        fields: Prisma.OvertimeDescriptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OvertimeDescriptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OvertimeDescriptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>
          }
          findFirst: {
            args: Prisma.OvertimeDescriptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OvertimeDescriptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>
          }
          findMany: {
            args: Prisma.OvertimeDescriptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>[]
          }
          create: {
            args: Prisma.OvertimeDescriptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>
          }
          createMany: {
            args: Prisma.OvertimeDescriptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OvertimeDescriptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>[]
          }
          delete: {
            args: Prisma.OvertimeDescriptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>
          }
          update: {
            args: Prisma.OvertimeDescriptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>
          }
          deleteMany: {
            args: Prisma.OvertimeDescriptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OvertimeDescriptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OvertimeDescriptionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>[]
          }
          upsert: {
            args: Prisma.OvertimeDescriptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OvertimeDescriptionPayload>
          }
          aggregate: {
            args: Prisma.OvertimeDescriptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOvertimeDescription>
          }
          groupBy: {
            args: Prisma.OvertimeDescriptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<OvertimeDescriptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.OvertimeDescriptionCountArgs<ExtArgs>
            result: $Utils.Optional<OvertimeDescriptionCountAggregateOutputType> | number
          }
        }
      }
      ApiLog: {
        payload: Prisma.$ApiLogPayload<ExtArgs>
        fields: Prisma.ApiLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ApiLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ApiLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>
          }
          findFirst: {
            args: Prisma.ApiLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ApiLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>
          }
          findMany: {
            args: Prisma.ApiLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>[]
          }
          create: {
            args: Prisma.ApiLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>
          }
          createMany: {
            args: Prisma.ApiLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ApiLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>[]
          }
          delete: {
            args: Prisma.ApiLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>
          }
          update: {
            args: Prisma.ApiLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>
          }
          deleteMany: {
            args: Prisma.ApiLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ApiLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ApiLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>[]
          }
          upsert: {
            args: Prisma.ApiLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiLogPayload>
          }
          aggregate: {
            args: Prisma.ApiLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApiLog>
          }
          groupBy: {
            args: Prisma.ApiLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<ApiLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.ApiLogCountArgs<ExtArgs>
            result: $Utils.Optional<ApiLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    group?: GroupOmit
    projectStatus?: ProjectStatusOmit
    project?: ProjectOmit
    feature?: FeatureOmit
    projectAssignee?: ProjectAssigneeOmit
    timesheetEntry?: TimesheetEntryOmit
    overtime?: OvertimeOmit
    overtimeDescription?: OvertimeDescriptionOmit
    apiLog?: ApiLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type GroupCountOutputType
   */

  export type GroupCountOutputType = {
    projects: number
  }

  export type GroupCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    projects?: boolean | GroupCountOutputTypeCountProjectsArgs
  }

  // Custom InputTypes
  /**
   * GroupCountOutputType without action
   */
  export type GroupCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupCountOutputType
     */
    select?: GroupCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GroupCountOutputType without action
   */
  export type GroupCountOutputTypeCountProjectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectWhereInput
  }


  /**
   * Count Type ProjectStatusCountOutputType
   */

  export type ProjectStatusCountOutputType = {
    projects: number
    features: number
  }

  export type ProjectStatusCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    projects?: boolean | ProjectStatusCountOutputTypeCountProjectsArgs
    features?: boolean | ProjectStatusCountOutputTypeCountFeaturesArgs
  }

  // Custom InputTypes
  /**
   * ProjectStatusCountOutputType without action
   */
  export type ProjectStatusCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatusCountOutputType
     */
    select?: ProjectStatusCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProjectStatusCountOutputType without action
   */
  export type ProjectStatusCountOutputTypeCountProjectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectWhereInput
  }

  /**
   * ProjectStatusCountOutputType without action
   */
  export type ProjectStatusCountOutputTypeCountFeaturesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FeatureWhereInput
  }


  /**
   * Count Type ProjectCountOutputType
   */

  export type ProjectCountOutputType = {
    features: number
    projectAssignees: number
    timesheets: number
  }

  export type ProjectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    features?: boolean | ProjectCountOutputTypeCountFeaturesArgs
    projectAssignees?: boolean | ProjectCountOutputTypeCountProjectAssigneesArgs
    timesheets?: boolean | ProjectCountOutputTypeCountTimesheetsArgs
  }

  // Custom InputTypes
  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectCountOutputType
     */
    select?: ProjectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountFeaturesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FeatureWhereInput
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountProjectAssigneesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectAssigneeWhereInput
  }

  /**
   * ProjectCountOutputType without action
   */
  export type ProjectCountOutputTypeCountTimesheetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimesheetEntryWhereInput
  }


  /**
   * Count Type FeatureCountOutputType
   */

  export type FeatureCountOutputType = {
    projectAssignees: number
    timesheets: number
  }

  export type FeatureCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    projectAssignees?: boolean | FeatureCountOutputTypeCountProjectAssigneesArgs
    timesheets?: boolean | FeatureCountOutputTypeCountTimesheetsArgs
  }

  // Custom InputTypes
  /**
   * FeatureCountOutputType without action
   */
  export type FeatureCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeatureCountOutputType
     */
    select?: FeatureCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FeatureCountOutputType without action
   */
  export type FeatureCountOutputTypeCountProjectAssigneesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectAssigneeWhereInput
  }

  /**
   * FeatureCountOutputType without action
   */
  export type FeatureCountOutputTypeCountTimesheetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimesheetEntryWhereInput
  }


  /**
   * Count Type OvertimeCountOutputType
   */

  export type OvertimeCountOutputType = {
    descriptions: number
  }

  export type OvertimeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    descriptions?: boolean | OvertimeCountOutputTypeCountDescriptionsArgs
  }

  // Custom InputTypes
  /**
   * OvertimeCountOutputType without action
   */
  export type OvertimeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeCountOutputType
     */
    select?: OvertimeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * OvertimeCountOutputType without action
   */
  export type OvertimeCountOutputTypeCountDescriptionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OvertimeDescriptionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Group
   */

  export type AggregateGroup = {
    _count: GroupCountAggregateOutputType | null
    _avg: GroupAvgAggregateOutputType | null
    _sum: GroupSumAggregateOutputType | null
    _min: GroupMinAggregateOutputType | null
    _max: GroupMaxAggregateOutputType | null
  }

  export type GroupAvgAggregateOutputType = {
    id: number | null
  }

  export type GroupSumAggregateOutputType = {
    id: number | null
  }

  export type GroupMinAggregateOutputType = {
    id: number | null
    name_th: string | null
    name_en: string | null
  }

  export type GroupMaxAggregateOutputType = {
    id: number | null
    name_th: string | null
    name_en: string | null
  }

  export type GroupCountAggregateOutputType = {
    id: number
    name_th: number
    name_en: number
    _all: number
  }


  export type GroupAvgAggregateInputType = {
    id?: true
  }

  export type GroupSumAggregateInputType = {
    id?: true
  }

  export type GroupMinAggregateInputType = {
    id?: true
    name_th?: true
    name_en?: true
  }

  export type GroupMaxAggregateInputType = {
    id?: true
    name_th?: true
    name_en?: true
  }

  export type GroupCountAggregateInputType = {
    id?: true
    name_th?: true
    name_en?: true
    _all?: true
  }

  export type GroupAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Group to aggregate.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Groups
    **/
    _count?: true | GroupCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GroupAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GroupSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GroupMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GroupMaxAggregateInputType
  }

  export type GetGroupAggregateType<T extends GroupAggregateArgs> = {
        [P in keyof T & keyof AggregateGroup]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGroup[P]>
      : GetScalarType<T[P], AggregateGroup[P]>
  }




  export type GroupGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupWhereInput
    orderBy?: GroupOrderByWithAggregationInput | GroupOrderByWithAggregationInput[]
    by: GroupScalarFieldEnum[] | GroupScalarFieldEnum
    having?: GroupScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GroupCountAggregateInputType | true
    _avg?: GroupAvgAggregateInputType
    _sum?: GroupSumAggregateInputType
    _min?: GroupMinAggregateInputType
    _max?: GroupMaxAggregateInputType
  }

  export type GroupGroupByOutputType = {
    id: number
    name_th: string
    name_en: string | null
    _count: GroupCountAggregateOutputType | null
    _avg: GroupAvgAggregateOutputType | null
    _sum: GroupSumAggregateOutputType | null
    _min: GroupMinAggregateOutputType | null
    _max: GroupMaxAggregateOutputType | null
  }

  type GetGroupGroupByPayload<T extends GroupGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GroupGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GroupGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GroupGroupByOutputType[P]>
            : GetScalarType<T[P], GroupGroupByOutputType[P]>
        }
      >
    >


  export type GroupSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name_th?: boolean
    name_en?: boolean
    projects?: boolean | Group$projectsArgs<ExtArgs>
    _count?: boolean | GroupCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["group"]>

  export type GroupSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name_th?: boolean
    name_en?: boolean
  }, ExtArgs["result"]["group"]>

  export type GroupSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name_th?: boolean
    name_en?: boolean
  }, ExtArgs["result"]["group"]>

  export type GroupSelectScalar = {
    id?: boolean
    name_th?: boolean
    name_en?: boolean
  }

  export type GroupOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name_th" | "name_en", ExtArgs["result"]["group"]>
  export type GroupInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    projects?: boolean | Group$projectsArgs<ExtArgs>
    _count?: boolean | GroupCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GroupIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type GroupIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $GroupPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Group"
    objects: {
      projects: Prisma.$ProjectPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name_th: string
      name_en: string | null
    }, ExtArgs["result"]["group"]>
    composites: {}
  }

  type GroupGetPayload<S extends boolean | null | undefined | GroupDefaultArgs> = $Result.GetResult<Prisma.$GroupPayload, S>

  type GroupCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GroupFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GroupCountAggregateInputType | true
    }

  export interface GroupDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Group'], meta: { name: 'Group' } }
    /**
     * Find zero or one Group that matches the filter.
     * @param {GroupFindUniqueArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GroupFindUniqueArgs>(args: SelectSubset<T, GroupFindUniqueArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Group that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GroupFindUniqueOrThrowArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GroupFindUniqueOrThrowArgs>(args: SelectSubset<T, GroupFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Group that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupFindFirstArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GroupFindFirstArgs>(args?: SelectSubset<T, GroupFindFirstArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Group that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupFindFirstOrThrowArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GroupFindFirstOrThrowArgs>(args?: SelectSubset<T, GroupFindFirstOrThrowArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Groups that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Groups
     * const groups = await prisma.group.findMany()
     * 
     * // Get first 10 Groups
     * const groups = await prisma.group.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const groupWithIdOnly = await prisma.group.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GroupFindManyArgs>(args?: SelectSubset<T, GroupFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Group.
     * @param {GroupCreateArgs} args - Arguments to create a Group.
     * @example
     * // Create one Group
     * const Group = await prisma.group.create({
     *   data: {
     *     // ... data to create a Group
     *   }
     * })
     * 
     */
    create<T extends GroupCreateArgs>(args: SelectSubset<T, GroupCreateArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Groups.
     * @param {GroupCreateManyArgs} args - Arguments to create many Groups.
     * @example
     * // Create many Groups
     * const group = await prisma.group.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GroupCreateManyArgs>(args?: SelectSubset<T, GroupCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Groups and returns the data saved in the database.
     * @param {GroupCreateManyAndReturnArgs} args - Arguments to create many Groups.
     * @example
     * // Create many Groups
     * const group = await prisma.group.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Groups and only return the `id`
     * const groupWithIdOnly = await prisma.group.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GroupCreateManyAndReturnArgs>(args?: SelectSubset<T, GroupCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Group.
     * @param {GroupDeleteArgs} args - Arguments to delete one Group.
     * @example
     * // Delete one Group
     * const Group = await prisma.group.delete({
     *   where: {
     *     // ... filter to delete one Group
     *   }
     * })
     * 
     */
    delete<T extends GroupDeleteArgs>(args: SelectSubset<T, GroupDeleteArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Group.
     * @param {GroupUpdateArgs} args - Arguments to update one Group.
     * @example
     * // Update one Group
     * const group = await prisma.group.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GroupUpdateArgs>(args: SelectSubset<T, GroupUpdateArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Groups.
     * @param {GroupDeleteManyArgs} args - Arguments to filter Groups to delete.
     * @example
     * // Delete a few Groups
     * const { count } = await prisma.group.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GroupDeleteManyArgs>(args?: SelectSubset<T, GroupDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Groups.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Groups
     * const group = await prisma.group.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GroupUpdateManyArgs>(args: SelectSubset<T, GroupUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Groups and returns the data updated in the database.
     * @param {GroupUpdateManyAndReturnArgs} args - Arguments to update many Groups.
     * @example
     * // Update many Groups
     * const group = await prisma.group.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Groups and only return the `id`
     * const groupWithIdOnly = await prisma.group.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GroupUpdateManyAndReturnArgs>(args: SelectSubset<T, GroupUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Group.
     * @param {GroupUpsertArgs} args - Arguments to update or create a Group.
     * @example
     * // Update or create a Group
     * const group = await prisma.group.upsert({
     *   create: {
     *     // ... data to create a Group
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Group we want to update
     *   }
     * })
     */
    upsert<T extends GroupUpsertArgs>(args: SelectSubset<T, GroupUpsertArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Groups.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupCountArgs} args - Arguments to filter Groups to count.
     * @example
     * // Count the number of Groups
     * const count = await prisma.group.count({
     *   where: {
     *     // ... the filter for the Groups we want to count
     *   }
     * })
    **/
    count<T extends GroupCountArgs>(
      args?: Subset<T, GroupCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GroupCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Group.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GroupAggregateArgs>(args: Subset<T, GroupAggregateArgs>): Prisma.PrismaPromise<GetGroupAggregateType<T>>

    /**
     * Group by Group.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GroupGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GroupGroupByArgs['orderBy'] }
        : { orderBy?: GroupGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GroupGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGroupGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Group model
   */
  readonly fields: GroupFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Group.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GroupClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    projects<T extends Group$projectsArgs<ExtArgs> = {}>(args?: Subset<T, Group$projectsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Group model
   */
  interface GroupFieldRefs {
    readonly id: FieldRef<"Group", 'Int'>
    readonly name_th: FieldRef<"Group", 'String'>
    readonly name_en: FieldRef<"Group", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Group findUnique
   */
  export type GroupFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group findUniqueOrThrow
   */
  export type GroupFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group findFirst
   */
  export type GroupFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Groups.
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Groups.
     */
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * Group findFirstOrThrow
   */
  export type GroupFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Groups.
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Groups.
     */
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * Group findMany
   */
  export type GroupFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Groups to fetch.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Groups.
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * Group create
   */
  export type GroupCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * The data needed to create a Group.
     */
    data: XOR<GroupCreateInput, GroupUncheckedCreateInput>
  }

  /**
   * Group createMany
   */
  export type GroupCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Groups.
     */
    data: GroupCreateManyInput | GroupCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Group createManyAndReturn
   */
  export type GroupCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * The data used to create many Groups.
     */
    data: GroupCreateManyInput | GroupCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Group update
   */
  export type GroupUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * The data needed to update a Group.
     */
    data: XOR<GroupUpdateInput, GroupUncheckedUpdateInput>
    /**
     * Choose, which Group to update.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group updateMany
   */
  export type GroupUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Groups.
     */
    data: XOR<GroupUpdateManyMutationInput, GroupUncheckedUpdateManyInput>
    /**
     * Filter which Groups to update
     */
    where?: GroupWhereInput
    /**
     * Limit how many Groups to update.
     */
    limit?: number
  }

  /**
   * Group updateManyAndReturn
   */
  export type GroupUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * The data used to update Groups.
     */
    data: XOR<GroupUpdateManyMutationInput, GroupUncheckedUpdateManyInput>
    /**
     * Filter which Groups to update
     */
    where?: GroupWhereInput
    /**
     * Limit how many Groups to update.
     */
    limit?: number
  }

  /**
   * Group upsert
   */
  export type GroupUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * The filter to search for the Group to update in case it exists.
     */
    where: GroupWhereUniqueInput
    /**
     * In case the Group found by the `where` argument doesn't exist, create a new Group with this data.
     */
    create: XOR<GroupCreateInput, GroupUncheckedCreateInput>
    /**
     * In case the Group was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GroupUpdateInput, GroupUncheckedUpdateInput>
  }

  /**
   * Group delete
   */
  export type GroupDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter which Group to delete.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group deleteMany
   */
  export type GroupDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Groups to delete
     */
    where?: GroupWhereInput
    /**
     * Limit how many Groups to delete.
     */
    limit?: number
  }

  /**
   * Group.projects
   */
  export type Group$projectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    where?: ProjectWhereInput
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    cursor?: ProjectWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Group without action
   */
  export type GroupDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
  }


  /**
   * Model ProjectStatus
   */

  export type AggregateProjectStatus = {
    _count: ProjectStatusCountAggregateOutputType | null
    _avg: ProjectStatusAvgAggregateOutputType | null
    _sum: ProjectStatusSumAggregateOutputType | null
    _min: ProjectStatusMinAggregateOutputType | null
    _max: ProjectStatusMaxAggregateOutputType | null
  }

  export type ProjectStatusAvgAggregateOutputType = {
    id: number | null
    priority: number | null
  }

  export type ProjectStatusSumAggregateOutputType = {
    id: number | null
    priority: number | null
  }

  export type ProjectStatusMinAggregateOutputType = {
    id: number | null
    priority: number | null
    nameTh: string | null
    nameEn: string | null
  }

  export type ProjectStatusMaxAggregateOutputType = {
    id: number | null
    priority: number | null
    nameTh: string | null
    nameEn: string | null
  }

  export type ProjectStatusCountAggregateOutputType = {
    id: number
    priority: number
    nameTh: number
    nameEn: number
    _all: number
  }


  export type ProjectStatusAvgAggregateInputType = {
    id?: true
    priority?: true
  }

  export type ProjectStatusSumAggregateInputType = {
    id?: true
    priority?: true
  }

  export type ProjectStatusMinAggregateInputType = {
    id?: true
    priority?: true
    nameTh?: true
    nameEn?: true
  }

  export type ProjectStatusMaxAggregateInputType = {
    id?: true
    priority?: true
    nameTh?: true
    nameEn?: true
  }

  export type ProjectStatusCountAggregateInputType = {
    id?: true
    priority?: true
    nameTh?: true
    nameEn?: true
    _all?: true
  }

  export type ProjectStatusAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProjectStatus to aggregate.
     */
    where?: ProjectStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectStatuses to fetch.
     */
    orderBy?: ProjectStatusOrderByWithRelationInput | ProjectStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProjectStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectStatuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProjectStatuses
    **/
    _count?: true | ProjectStatusCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProjectStatusAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProjectStatusSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProjectStatusMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProjectStatusMaxAggregateInputType
  }

  export type GetProjectStatusAggregateType<T extends ProjectStatusAggregateArgs> = {
        [P in keyof T & keyof AggregateProjectStatus]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProjectStatus[P]>
      : GetScalarType<T[P], AggregateProjectStatus[P]>
  }




  export type ProjectStatusGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectStatusWhereInput
    orderBy?: ProjectStatusOrderByWithAggregationInput | ProjectStatusOrderByWithAggregationInput[]
    by: ProjectStatusScalarFieldEnum[] | ProjectStatusScalarFieldEnum
    having?: ProjectStatusScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProjectStatusCountAggregateInputType | true
    _avg?: ProjectStatusAvgAggregateInputType
    _sum?: ProjectStatusSumAggregateInputType
    _min?: ProjectStatusMinAggregateInputType
    _max?: ProjectStatusMaxAggregateInputType
  }

  export type ProjectStatusGroupByOutputType = {
    id: number
    priority: number
    nameTh: string
    nameEn: string | null
    _count: ProjectStatusCountAggregateOutputType | null
    _avg: ProjectStatusAvgAggregateOutputType | null
    _sum: ProjectStatusSumAggregateOutputType | null
    _min: ProjectStatusMinAggregateOutputType | null
    _max: ProjectStatusMaxAggregateOutputType | null
  }

  type GetProjectStatusGroupByPayload<T extends ProjectStatusGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProjectStatusGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProjectStatusGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProjectStatusGroupByOutputType[P]>
            : GetScalarType<T[P], ProjectStatusGroupByOutputType[P]>
        }
      >
    >


  export type ProjectStatusSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    priority?: boolean
    nameTh?: boolean
    nameEn?: boolean
    projects?: boolean | ProjectStatus$projectsArgs<ExtArgs>
    features?: boolean | ProjectStatus$featuresArgs<ExtArgs>
    _count?: boolean | ProjectStatusCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["projectStatus"]>

  export type ProjectStatusSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    priority?: boolean
    nameTh?: boolean
    nameEn?: boolean
  }, ExtArgs["result"]["projectStatus"]>

  export type ProjectStatusSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    priority?: boolean
    nameTh?: boolean
    nameEn?: boolean
  }, ExtArgs["result"]["projectStatus"]>

  export type ProjectStatusSelectScalar = {
    id?: boolean
    priority?: boolean
    nameTh?: boolean
    nameEn?: boolean
  }

  export type ProjectStatusOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "priority" | "nameTh" | "nameEn", ExtArgs["result"]["projectStatus"]>
  export type ProjectStatusInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    projects?: boolean | ProjectStatus$projectsArgs<ExtArgs>
    features?: boolean | ProjectStatus$featuresArgs<ExtArgs>
    _count?: boolean | ProjectStatusCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProjectStatusIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ProjectStatusIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProjectStatusPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProjectStatus"
    objects: {
      projects: Prisma.$ProjectPayload<ExtArgs>[]
      features: Prisma.$FeaturePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      priority: number
      nameTh: string
      nameEn: string | null
    }, ExtArgs["result"]["projectStatus"]>
    composites: {}
  }

  type ProjectStatusGetPayload<S extends boolean | null | undefined | ProjectStatusDefaultArgs> = $Result.GetResult<Prisma.$ProjectStatusPayload, S>

  type ProjectStatusCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProjectStatusFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProjectStatusCountAggregateInputType | true
    }

  export interface ProjectStatusDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProjectStatus'], meta: { name: 'ProjectStatus' } }
    /**
     * Find zero or one ProjectStatus that matches the filter.
     * @param {ProjectStatusFindUniqueArgs} args - Arguments to find a ProjectStatus
     * @example
     * // Get one ProjectStatus
     * const projectStatus = await prisma.projectStatus.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProjectStatusFindUniqueArgs>(args: SelectSubset<T, ProjectStatusFindUniqueArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProjectStatus that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProjectStatusFindUniqueOrThrowArgs} args - Arguments to find a ProjectStatus
     * @example
     * // Get one ProjectStatus
     * const projectStatus = await prisma.projectStatus.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProjectStatusFindUniqueOrThrowArgs>(args: SelectSubset<T, ProjectStatusFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProjectStatus that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusFindFirstArgs} args - Arguments to find a ProjectStatus
     * @example
     * // Get one ProjectStatus
     * const projectStatus = await prisma.projectStatus.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProjectStatusFindFirstArgs>(args?: SelectSubset<T, ProjectStatusFindFirstArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProjectStatus that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusFindFirstOrThrowArgs} args - Arguments to find a ProjectStatus
     * @example
     * // Get one ProjectStatus
     * const projectStatus = await prisma.projectStatus.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProjectStatusFindFirstOrThrowArgs>(args?: SelectSubset<T, ProjectStatusFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProjectStatuses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProjectStatuses
     * const projectStatuses = await prisma.projectStatus.findMany()
     * 
     * // Get first 10 ProjectStatuses
     * const projectStatuses = await prisma.projectStatus.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const projectStatusWithIdOnly = await prisma.projectStatus.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProjectStatusFindManyArgs>(args?: SelectSubset<T, ProjectStatusFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProjectStatus.
     * @param {ProjectStatusCreateArgs} args - Arguments to create a ProjectStatus.
     * @example
     * // Create one ProjectStatus
     * const ProjectStatus = await prisma.projectStatus.create({
     *   data: {
     *     // ... data to create a ProjectStatus
     *   }
     * })
     * 
     */
    create<T extends ProjectStatusCreateArgs>(args: SelectSubset<T, ProjectStatusCreateArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProjectStatuses.
     * @param {ProjectStatusCreateManyArgs} args - Arguments to create many ProjectStatuses.
     * @example
     * // Create many ProjectStatuses
     * const projectStatus = await prisma.projectStatus.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProjectStatusCreateManyArgs>(args?: SelectSubset<T, ProjectStatusCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProjectStatuses and returns the data saved in the database.
     * @param {ProjectStatusCreateManyAndReturnArgs} args - Arguments to create many ProjectStatuses.
     * @example
     * // Create many ProjectStatuses
     * const projectStatus = await prisma.projectStatus.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProjectStatuses and only return the `id`
     * const projectStatusWithIdOnly = await prisma.projectStatus.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProjectStatusCreateManyAndReturnArgs>(args?: SelectSubset<T, ProjectStatusCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProjectStatus.
     * @param {ProjectStatusDeleteArgs} args - Arguments to delete one ProjectStatus.
     * @example
     * // Delete one ProjectStatus
     * const ProjectStatus = await prisma.projectStatus.delete({
     *   where: {
     *     // ... filter to delete one ProjectStatus
     *   }
     * })
     * 
     */
    delete<T extends ProjectStatusDeleteArgs>(args: SelectSubset<T, ProjectStatusDeleteArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProjectStatus.
     * @param {ProjectStatusUpdateArgs} args - Arguments to update one ProjectStatus.
     * @example
     * // Update one ProjectStatus
     * const projectStatus = await prisma.projectStatus.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProjectStatusUpdateArgs>(args: SelectSubset<T, ProjectStatusUpdateArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProjectStatuses.
     * @param {ProjectStatusDeleteManyArgs} args - Arguments to filter ProjectStatuses to delete.
     * @example
     * // Delete a few ProjectStatuses
     * const { count } = await prisma.projectStatus.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProjectStatusDeleteManyArgs>(args?: SelectSubset<T, ProjectStatusDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProjectStatuses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProjectStatuses
     * const projectStatus = await prisma.projectStatus.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProjectStatusUpdateManyArgs>(args: SelectSubset<T, ProjectStatusUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProjectStatuses and returns the data updated in the database.
     * @param {ProjectStatusUpdateManyAndReturnArgs} args - Arguments to update many ProjectStatuses.
     * @example
     * // Update many ProjectStatuses
     * const projectStatus = await prisma.projectStatus.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProjectStatuses and only return the `id`
     * const projectStatusWithIdOnly = await prisma.projectStatus.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProjectStatusUpdateManyAndReturnArgs>(args: SelectSubset<T, ProjectStatusUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProjectStatus.
     * @param {ProjectStatusUpsertArgs} args - Arguments to update or create a ProjectStatus.
     * @example
     * // Update or create a ProjectStatus
     * const projectStatus = await prisma.projectStatus.upsert({
     *   create: {
     *     // ... data to create a ProjectStatus
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProjectStatus we want to update
     *   }
     * })
     */
    upsert<T extends ProjectStatusUpsertArgs>(args: SelectSubset<T, ProjectStatusUpsertArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProjectStatuses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusCountArgs} args - Arguments to filter ProjectStatuses to count.
     * @example
     * // Count the number of ProjectStatuses
     * const count = await prisma.projectStatus.count({
     *   where: {
     *     // ... the filter for the ProjectStatuses we want to count
     *   }
     * })
    **/
    count<T extends ProjectStatusCountArgs>(
      args?: Subset<T, ProjectStatusCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProjectStatusCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProjectStatus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProjectStatusAggregateArgs>(args: Subset<T, ProjectStatusAggregateArgs>): Prisma.PrismaPromise<GetProjectStatusAggregateType<T>>

    /**
     * Group by ProjectStatus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectStatusGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProjectStatusGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProjectStatusGroupByArgs['orderBy'] }
        : { orderBy?: ProjectStatusGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProjectStatusGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProjectStatusGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProjectStatus model
   */
  readonly fields: ProjectStatusFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProjectStatus.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProjectStatusClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    projects<T extends ProjectStatus$projectsArgs<ExtArgs> = {}>(args?: Subset<T, ProjectStatus$projectsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    features<T extends ProjectStatus$featuresArgs<ExtArgs> = {}>(args?: Subset<T, ProjectStatus$featuresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProjectStatus model
   */
  interface ProjectStatusFieldRefs {
    readonly id: FieldRef<"ProjectStatus", 'Int'>
    readonly priority: FieldRef<"ProjectStatus", 'Int'>
    readonly nameTh: FieldRef<"ProjectStatus", 'String'>
    readonly nameEn: FieldRef<"ProjectStatus", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ProjectStatus findUnique
   */
  export type ProjectStatusFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * Filter, which ProjectStatus to fetch.
     */
    where: ProjectStatusWhereUniqueInput
  }

  /**
   * ProjectStatus findUniqueOrThrow
   */
  export type ProjectStatusFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * Filter, which ProjectStatus to fetch.
     */
    where: ProjectStatusWhereUniqueInput
  }

  /**
   * ProjectStatus findFirst
   */
  export type ProjectStatusFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * Filter, which ProjectStatus to fetch.
     */
    where?: ProjectStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectStatuses to fetch.
     */
    orderBy?: ProjectStatusOrderByWithRelationInput | ProjectStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProjectStatuses.
     */
    cursor?: ProjectStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectStatuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProjectStatuses.
     */
    distinct?: ProjectStatusScalarFieldEnum | ProjectStatusScalarFieldEnum[]
  }

  /**
   * ProjectStatus findFirstOrThrow
   */
  export type ProjectStatusFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * Filter, which ProjectStatus to fetch.
     */
    where?: ProjectStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectStatuses to fetch.
     */
    orderBy?: ProjectStatusOrderByWithRelationInput | ProjectStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProjectStatuses.
     */
    cursor?: ProjectStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectStatuses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProjectStatuses.
     */
    distinct?: ProjectStatusScalarFieldEnum | ProjectStatusScalarFieldEnum[]
  }

  /**
   * ProjectStatus findMany
   */
  export type ProjectStatusFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * Filter, which ProjectStatuses to fetch.
     */
    where?: ProjectStatusWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectStatuses to fetch.
     */
    orderBy?: ProjectStatusOrderByWithRelationInput | ProjectStatusOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProjectStatuses.
     */
    cursor?: ProjectStatusWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectStatuses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectStatuses.
     */
    skip?: number
    distinct?: ProjectStatusScalarFieldEnum | ProjectStatusScalarFieldEnum[]
  }

  /**
   * ProjectStatus create
   */
  export type ProjectStatusCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * The data needed to create a ProjectStatus.
     */
    data: XOR<ProjectStatusCreateInput, ProjectStatusUncheckedCreateInput>
  }

  /**
   * ProjectStatus createMany
   */
  export type ProjectStatusCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProjectStatuses.
     */
    data: ProjectStatusCreateManyInput | ProjectStatusCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProjectStatus createManyAndReturn
   */
  export type ProjectStatusCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * The data used to create many ProjectStatuses.
     */
    data: ProjectStatusCreateManyInput | ProjectStatusCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProjectStatus update
   */
  export type ProjectStatusUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * The data needed to update a ProjectStatus.
     */
    data: XOR<ProjectStatusUpdateInput, ProjectStatusUncheckedUpdateInput>
    /**
     * Choose, which ProjectStatus to update.
     */
    where: ProjectStatusWhereUniqueInput
  }

  /**
   * ProjectStatus updateMany
   */
  export type ProjectStatusUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProjectStatuses.
     */
    data: XOR<ProjectStatusUpdateManyMutationInput, ProjectStatusUncheckedUpdateManyInput>
    /**
     * Filter which ProjectStatuses to update
     */
    where?: ProjectStatusWhereInput
    /**
     * Limit how many ProjectStatuses to update.
     */
    limit?: number
  }

  /**
   * ProjectStatus updateManyAndReturn
   */
  export type ProjectStatusUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * The data used to update ProjectStatuses.
     */
    data: XOR<ProjectStatusUpdateManyMutationInput, ProjectStatusUncheckedUpdateManyInput>
    /**
     * Filter which ProjectStatuses to update
     */
    where?: ProjectStatusWhereInput
    /**
     * Limit how many ProjectStatuses to update.
     */
    limit?: number
  }

  /**
   * ProjectStatus upsert
   */
  export type ProjectStatusUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * The filter to search for the ProjectStatus to update in case it exists.
     */
    where: ProjectStatusWhereUniqueInput
    /**
     * In case the ProjectStatus found by the `where` argument doesn't exist, create a new ProjectStatus with this data.
     */
    create: XOR<ProjectStatusCreateInput, ProjectStatusUncheckedCreateInput>
    /**
     * In case the ProjectStatus was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProjectStatusUpdateInput, ProjectStatusUncheckedUpdateInput>
  }

  /**
   * ProjectStatus delete
   */
  export type ProjectStatusDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    /**
     * Filter which ProjectStatus to delete.
     */
    where: ProjectStatusWhereUniqueInput
  }

  /**
   * ProjectStatus deleteMany
   */
  export type ProjectStatusDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProjectStatuses to delete
     */
    where?: ProjectStatusWhereInput
    /**
     * Limit how many ProjectStatuses to delete.
     */
    limit?: number
  }

  /**
   * ProjectStatus.projects
   */
  export type ProjectStatus$projectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    where?: ProjectWhereInput
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    cursor?: ProjectWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * ProjectStatus.features
   */
  export type ProjectStatus$featuresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    where?: FeatureWhereInput
    orderBy?: FeatureOrderByWithRelationInput | FeatureOrderByWithRelationInput[]
    cursor?: FeatureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FeatureScalarFieldEnum | FeatureScalarFieldEnum[]
  }

  /**
   * ProjectStatus without action
   */
  export type ProjectStatusDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
  }


  /**
   * Model Project
   */

  export type AggregateProject = {
    _count: ProjectCountAggregateOutputType | null
    _avg: ProjectAvgAggregateOutputType | null
    _sum: ProjectSumAggregateOutputType | null
    _min: ProjectMinAggregateOutputType | null
    _max: ProjectMaxAggregateOutputType | null
  }

  export type ProjectAvgAggregateOutputType = {
    id: number | null
    estimateWorkhours: Decimal | null
    group_id: number | null
    projectStatusId: number | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type ProjectSumAggregateOutputType = {
    id: number | null
    estimateWorkhours: Decimal | null
    group_id: number | null
    projectStatusId: number | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type ProjectMinAggregateOutputType = {
    id: number | null
    name: string | null
    name_en: string | null
    description: string | null
    categoryType: string | null
    approval: string | null
    approval_status: string | null
    status: string | null
    start_date: Date | null
    end_date: Date | null
    completeDate: Date | null
    estimateWorkhours: Decimal | null
    group_id: number | null
    projectStatusId: number | null
    is_deleted: boolean | null
    createdAt: Date | null
    createdBy: number | null
    updatedAt: Date | null
    updatedBy: number | null
  }

  export type ProjectMaxAggregateOutputType = {
    id: number | null
    name: string | null
    name_en: string | null
    description: string | null
    categoryType: string | null
    approval: string | null
    approval_status: string | null
    status: string | null
    start_date: Date | null
    end_date: Date | null
    completeDate: Date | null
    estimateWorkhours: Decimal | null
    group_id: number | null
    projectStatusId: number | null
    is_deleted: boolean | null
    createdAt: Date | null
    createdBy: number | null
    updatedAt: Date | null
    updatedBy: number | null
  }

  export type ProjectCountAggregateOutputType = {
    id: number
    name: number
    name_en: number
    description: number
    categoryType: number
    approval: number
    approval_status: number
    status: number
    start_date: number
    end_date: number
    completeDate: number
    estimateWorkhours: number
    group_id: number
    projectStatusId: number
    is_deleted: number
    createdAt: number
    createdBy: number
    updatedAt: number
    updatedBy: number
    _all: number
  }


  export type ProjectAvgAggregateInputType = {
    id?: true
    estimateWorkhours?: true
    group_id?: true
    projectStatusId?: true
    createdBy?: true
    updatedBy?: true
  }

  export type ProjectSumAggregateInputType = {
    id?: true
    estimateWorkhours?: true
    group_id?: true
    projectStatusId?: true
    createdBy?: true
    updatedBy?: true
  }

  export type ProjectMinAggregateInputType = {
    id?: true
    name?: true
    name_en?: true
    description?: true
    categoryType?: true
    approval?: true
    approval_status?: true
    status?: true
    start_date?: true
    end_date?: true
    completeDate?: true
    estimateWorkhours?: true
    group_id?: true
    projectStatusId?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type ProjectMaxAggregateInputType = {
    id?: true
    name?: true
    name_en?: true
    description?: true
    categoryType?: true
    approval?: true
    approval_status?: true
    status?: true
    start_date?: true
    end_date?: true
    completeDate?: true
    estimateWorkhours?: true
    group_id?: true
    projectStatusId?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type ProjectCountAggregateInputType = {
    id?: true
    name?: true
    name_en?: true
    description?: true
    categoryType?: true
    approval?: true
    approval_status?: true
    status?: true
    start_date?: true
    end_date?: true
    completeDate?: true
    estimateWorkhours?: true
    group_id?: true
    projectStatusId?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
    _all?: true
  }

  export type ProjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Project to aggregate.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Projects
    **/
    _count?: true | ProjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProjectAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProjectSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProjectMaxAggregateInputType
  }

  export type GetProjectAggregateType<T extends ProjectAggregateArgs> = {
        [P in keyof T & keyof AggregateProject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProject[P]>
      : GetScalarType<T[P], AggregateProject[P]>
  }




  export type ProjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectWhereInput
    orderBy?: ProjectOrderByWithAggregationInput | ProjectOrderByWithAggregationInput[]
    by: ProjectScalarFieldEnum[] | ProjectScalarFieldEnum
    having?: ProjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProjectCountAggregateInputType | true
    _avg?: ProjectAvgAggregateInputType
    _sum?: ProjectSumAggregateInputType
    _min?: ProjectMinAggregateInputType
    _max?: ProjectMaxAggregateInputType
  }

  export type ProjectGroupByOutputType = {
    id: number
    name: string
    name_en: string | null
    description: string
    categoryType: string | null
    approval: string
    approval_status: string
    status: string
    start_date: Date | null
    end_date: Date | null
    completeDate: Date | null
    estimateWorkhours: Decimal | null
    group_id: number | null
    projectStatusId: number | null
    is_deleted: boolean
    createdAt: Date
    createdBy: number | null
    updatedAt: Date
    updatedBy: number | null
    _count: ProjectCountAggregateOutputType | null
    _avg: ProjectAvgAggregateOutputType | null
    _sum: ProjectSumAggregateOutputType | null
    _min: ProjectMinAggregateOutputType | null
    _max: ProjectMaxAggregateOutputType | null
  }

  type GetProjectGroupByPayload<T extends ProjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProjectGroupByOutputType[P]>
            : GetScalarType<T[P], ProjectGroupByOutputType[P]>
        }
      >
    >


  export type ProjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    name_en?: boolean
    description?: boolean
    categoryType?: boolean
    approval?: boolean
    approval_status?: boolean
    status?: boolean
    start_date?: boolean
    end_date?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    group_id?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    group?: boolean | Project$groupArgs<ExtArgs>
    projectStatus?: boolean | Project$projectStatusArgs<ExtArgs>
    features?: boolean | Project$featuresArgs<ExtArgs>
    projectAssignees?: boolean | Project$projectAssigneesArgs<ExtArgs>
    timesheets?: boolean | Project$timesheetsArgs<ExtArgs>
    _count?: boolean | ProjectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    name_en?: boolean
    description?: boolean
    categoryType?: boolean
    approval?: boolean
    approval_status?: boolean
    status?: boolean
    start_date?: boolean
    end_date?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    group_id?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    group?: boolean | Project$groupArgs<ExtArgs>
    projectStatus?: boolean | Project$projectStatusArgs<ExtArgs>
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    name_en?: boolean
    description?: boolean
    categoryType?: boolean
    approval?: boolean
    approval_status?: boolean
    status?: boolean
    start_date?: boolean
    end_date?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    group_id?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    group?: boolean | Project$groupArgs<ExtArgs>
    projectStatus?: boolean | Project$projectStatusArgs<ExtArgs>
  }, ExtArgs["result"]["project"]>

  export type ProjectSelectScalar = {
    id?: boolean
    name?: boolean
    name_en?: boolean
    description?: boolean
    categoryType?: boolean
    approval?: boolean
    approval_status?: boolean
    status?: boolean
    start_date?: boolean
    end_date?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    group_id?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
  }

  export type ProjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "name_en" | "description" | "categoryType" | "approval" | "approval_status" | "status" | "start_date" | "end_date" | "completeDate" | "estimateWorkhours" | "group_id" | "projectStatusId" | "is_deleted" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy", ExtArgs["result"]["project"]>
  export type ProjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | Project$groupArgs<ExtArgs>
    projectStatus?: boolean | Project$projectStatusArgs<ExtArgs>
    features?: boolean | Project$featuresArgs<ExtArgs>
    projectAssignees?: boolean | Project$projectAssigneesArgs<ExtArgs>
    timesheets?: boolean | Project$timesheetsArgs<ExtArgs>
    _count?: boolean | ProjectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | Project$groupArgs<ExtArgs>
    projectStatus?: boolean | Project$projectStatusArgs<ExtArgs>
  }
  export type ProjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | Project$groupArgs<ExtArgs>
    projectStatus?: boolean | Project$projectStatusArgs<ExtArgs>
  }

  export type $ProjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Project"
    objects: {
      group: Prisma.$GroupPayload<ExtArgs> | null
      projectStatus: Prisma.$ProjectStatusPayload<ExtArgs> | null
      features: Prisma.$FeaturePayload<ExtArgs>[]
      projectAssignees: Prisma.$ProjectAssigneePayload<ExtArgs>[]
      timesheets: Prisma.$TimesheetEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      name_en: string | null
      description: string
      categoryType: string | null
      approval: string
      approval_status: string
      status: string
      start_date: Date | null
      end_date: Date | null
      completeDate: Date | null
      estimateWorkhours: Prisma.Decimal | null
      group_id: number | null
      projectStatusId: number | null
      is_deleted: boolean
      createdAt: Date
      createdBy: number | null
      updatedAt: Date
      updatedBy: number | null
    }, ExtArgs["result"]["project"]>
    composites: {}
  }

  type ProjectGetPayload<S extends boolean | null | undefined | ProjectDefaultArgs> = $Result.GetResult<Prisma.$ProjectPayload, S>

  type ProjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProjectCountAggregateInputType | true
    }

  export interface ProjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Project'], meta: { name: 'Project' } }
    /**
     * Find zero or one Project that matches the filter.
     * @param {ProjectFindUniqueArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProjectFindUniqueArgs>(args: SelectSubset<T, ProjectFindUniqueArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Project that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProjectFindUniqueOrThrowArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProjectFindUniqueOrThrowArgs>(args: SelectSubset<T, ProjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Project that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindFirstArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProjectFindFirstArgs>(args?: SelectSubset<T, ProjectFindFirstArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Project that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindFirstOrThrowArgs} args - Arguments to find a Project
     * @example
     * // Get one Project
     * const project = await prisma.project.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProjectFindFirstOrThrowArgs>(args?: SelectSubset<T, ProjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Projects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Projects
     * const projects = await prisma.project.findMany()
     * 
     * // Get first 10 Projects
     * const projects = await prisma.project.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const projectWithIdOnly = await prisma.project.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProjectFindManyArgs>(args?: SelectSubset<T, ProjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Project.
     * @param {ProjectCreateArgs} args - Arguments to create a Project.
     * @example
     * // Create one Project
     * const Project = await prisma.project.create({
     *   data: {
     *     // ... data to create a Project
     *   }
     * })
     * 
     */
    create<T extends ProjectCreateArgs>(args: SelectSubset<T, ProjectCreateArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Projects.
     * @param {ProjectCreateManyArgs} args - Arguments to create many Projects.
     * @example
     * // Create many Projects
     * const project = await prisma.project.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProjectCreateManyArgs>(args?: SelectSubset<T, ProjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Projects and returns the data saved in the database.
     * @param {ProjectCreateManyAndReturnArgs} args - Arguments to create many Projects.
     * @example
     * // Create many Projects
     * const project = await prisma.project.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Projects and only return the `id`
     * const projectWithIdOnly = await prisma.project.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProjectCreateManyAndReturnArgs>(args?: SelectSubset<T, ProjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Project.
     * @param {ProjectDeleteArgs} args - Arguments to delete one Project.
     * @example
     * // Delete one Project
     * const Project = await prisma.project.delete({
     *   where: {
     *     // ... filter to delete one Project
     *   }
     * })
     * 
     */
    delete<T extends ProjectDeleteArgs>(args: SelectSubset<T, ProjectDeleteArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Project.
     * @param {ProjectUpdateArgs} args - Arguments to update one Project.
     * @example
     * // Update one Project
     * const project = await prisma.project.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProjectUpdateArgs>(args: SelectSubset<T, ProjectUpdateArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Projects.
     * @param {ProjectDeleteManyArgs} args - Arguments to filter Projects to delete.
     * @example
     * // Delete a few Projects
     * const { count } = await prisma.project.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProjectDeleteManyArgs>(args?: SelectSubset<T, ProjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Projects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Projects
     * const project = await prisma.project.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProjectUpdateManyArgs>(args: SelectSubset<T, ProjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Projects and returns the data updated in the database.
     * @param {ProjectUpdateManyAndReturnArgs} args - Arguments to update many Projects.
     * @example
     * // Update many Projects
     * const project = await prisma.project.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Projects and only return the `id`
     * const projectWithIdOnly = await prisma.project.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProjectUpdateManyAndReturnArgs>(args: SelectSubset<T, ProjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Project.
     * @param {ProjectUpsertArgs} args - Arguments to update or create a Project.
     * @example
     * // Update or create a Project
     * const project = await prisma.project.upsert({
     *   create: {
     *     // ... data to create a Project
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Project we want to update
     *   }
     * })
     */
    upsert<T extends ProjectUpsertArgs>(args: SelectSubset<T, ProjectUpsertArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Projects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectCountArgs} args - Arguments to filter Projects to count.
     * @example
     * // Count the number of Projects
     * const count = await prisma.project.count({
     *   where: {
     *     // ... the filter for the Projects we want to count
     *   }
     * })
    **/
    count<T extends ProjectCountArgs>(
      args?: Subset<T, ProjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Project.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProjectAggregateArgs>(args: Subset<T, ProjectAggregateArgs>): Prisma.PrismaPromise<GetProjectAggregateType<T>>

    /**
     * Group by Project.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProjectGroupByArgs['orderBy'] }
        : { orderBy?: ProjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Project model
   */
  readonly fields: ProjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Project.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    group<T extends Project$groupArgs<ExtArgs> = {}>(args?: Subset<T, Project$groupArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    projectStatus<T extends Project$projectStatusArgs<ExtArgs> = {}>(args?: Subset<T, Project$projectStatusArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    features<T extends Project$featuresArgs<ExtArgs> = {}>(args?: Subset<T, Project$featuresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    projectAssignees<T extends Project$projectAssigneesArgs<ExtArgs> = {}>(args?: Subset<T, Project$projectAssigneesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    timesheets<T extends Project$timesheetsArgs<ExtArgs> = {}>(args?: Subset<T, Project$timesheetsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Project model
   */
  interface ProjectFieldRefs {
    readonly id: FieldRef<"Project", 'Int'>
    readonly name: FieldRef<"Project", 'String'>
    readonly name_en: FieldRef<"Project", 'String'>
    readonly description: FieldRef<"Project", 'String'>
    readonly categoryType: FieldRef<"Project", 'String'>
    readonly approval: FieldRef<"Project", 'String'>
    readonly approval_status: FieldRef<"Project", 'String'>
    readonly status: FieldRef<"Project", 'String'>
    readonly start_date: FieldRef<"Project", 'DateTime'>
    readonly end_date: FieldRef<"Project", 'DateTime'>
    readonly completeDate: FieldRef<"Project", 'DateTime'>
    readonly estimateWorkhours: FieldRef<"Project", 'Decimal'>
    readonly group_id: FieldRef<"Project", 'Int'>
    readonly projectStatusId: FieldRef<"Project", 'Int'>
    readonly is_deleted: FieldRef<"Project", 'Boolean'>
    readonly createdAt: FieldRef<"Project", 'DateTime'>
    readonly createdBy: FieldRef<"Project", 'Int'>
    readonly updatedAt: FieldRef<"Project", 'DateTime'>
    readonly updatedBy: FieldRef<"Project", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Project findUnique
   */
  export type ProjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project findUniqueOrThrow
   */
  export type ProjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project findFirst
   */
  export type ProjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Projects.
     */
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project findFirstOrThrow
   */
  export type ProjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Project to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Projects.
     */
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project findMany
   */
  export type ProjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter, which Projects to fetch.
     */
    where?: ProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Projects to fetch.
     */
    orderBy?: ProjectOrderByWithRelationInput | ProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Projects.
     */
    cursor?: ProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Projects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Projects.
     */
    skip?: number
    distinct?: ProjectScalarFieldEnum | ProjectScalarFieldEnum[]
  }

  /**
   * Project create
   */
  export type ProjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The data needed to create a Project.
     */
    data: XOR<ProjectCreateInput, ProjectUncheckedCreateInput>
  }

  /**
   * Project createMany
   */
  export type ProjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Projects.
     */
    data: ProjectCreateManyInput | ProjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Project createManyAndReturn
   */
  export type ProjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * The data used to create many Projects.
     */
    data: ProjectCreateManyInput | ProjectCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Project update
   */
  export type ProjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The data needed to update a Project.
     */
    data: XOR<ProjectUpdateInput, ProjectUncheckedUpdateInput>
    /**
     * Choose, which Project to update.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project updateMany
   */
  export type ProjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Projects.
     */
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyInput>
    /**
     * Filter which Projects to update
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to update.
     */
    limit?: number
  }

  /**
   * Project updateManyAndReturn
   */
  export type ProjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * The data used to update Projects.
     */
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyInput>
    /**
     * Filter which Projects to update
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Project upsert
   */
  export type ProjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * The filter to search for the Project to update in case it exists.
     */
    where: ProjectWhereUniqueInput
    /**
     * In case the Project found by the `where` argument doesn't exist, create a new Project with this data.
     */
    create: XOR<ProjectCreateInput, ProjectUncheckedCreateInput>
    /**
     * In case the Project was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProjectUpdateInput, ProjectUncheckedUpdateInput>
  }

  /**
   * Project delete
   */
  export type ProjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
    /**
     * Filter which Project to delete.
     */
    where: ProjectWhereUniqueInput
  }

  /**
   * Project deleteMany
   */
  export type ProjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Projects to delete
     */
    where?: ProjectWhereInput
    /**
     * Limit how many Projects to delete.
     */
    limit?: number
  }

  /**
   * Project.group
   */
  export type Project$groupArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    where?: GroupWhereInput
  }

  /**
   * Project.projectStatus
   */
  export type Project$projectStatusArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    where?: ProjectStatusWhereInput
  }

  /**
   * Project.features
   */
  export type Project$featuresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    where?: FeatureWhereInput
    orderBy?: FeatureOrderByWithRelationInput | FeatureOrderByWithRelationInput[]
    cursor?: FeatureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FeatureScalarFieldEnum | FeatureScalarFieldEnum[]
  }

  /**
   * Project.projectAssignees
   */
  export type Project$projectAssigneesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    where?: ProjectAssigneeWhereInput
    orderBy?: ProjectAssigneeOrderByWithRelationInput | ProjectAssigneeOrderByWithRelationInput[]
    cursor?: ProjectAssigneeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProjectAssigneeScalarFieldEnum | ProjectAssigneeScalarFieldEnum[]
  }

  /**
   * Project.timesheets
   */
  export type Project$timesheetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    where?: TimesheetEntryWhereInput
    orderBy?: TimesheetEntryOrderByWithRelationInput | TimesheetEntryOrderByWithRelationInput[]
    cursor?: TimesheetEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TimesheetEntryScalarFieldEnum | TimesheetEntryScalarFieldEnum[]
  }

  /**
   * Project without action
   */
  export type ProjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Project
     */
    select?: ProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Project
     */
    omit?: ProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectInclude<ExtArgs> | null
  }


  /**
   * Model Feature
   */

  export type AggregateFeature = {
    _count: FeatureCountAggregateOutputType | null
    _avg: FeatureAvgAggregateOutputType | null
    _sum: FeatureSumAggregateOutputType | null
    _min: FeatureMinAggregateOutputType | null
    _max: FeatureMaxAggregateOutputType | null
  }

  export type FeatureAvgAggregateOutputType = {
    id: number | null
    projectId: number | null
    estimateWorkhours: Decimal | null
    projectStatusId: number | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type FeatureSumAggregateOutputType = {
    id: number | null
    projectId: number | null
    estimateWorkhours: Decimal | null
    projectStatusId: number | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type FeatureMinAggregateOutputType = {
    id: number | null
    projectId: number | null
    name: string | null
    name_en: string | null
    status: string | null
    assetCaptureType: $Enums.ProjectAssetCaptureType | null
    startDate: Date | null
    endDate: Date | null
    completeDate: Date | null
    estimateWorkhours: Decimal | null
    projectStatusId: number | null
    is_deleted: boolean | null
    createdAt: Date | null
    createdBy: number | null
    updatedAt: Date | null
    updatedBy: number | null
  }

  export type FeatureMaxAggregateOutputType = {
    id: number | null
    projectId: number | null
    name: string | null
    name_en: string | null
    status: string | null
    assetCaptureType: $Enums.ProjectAssetCaptureType | null
    startDate: Date | null
    endDate: Date | null
    completeDate: Date | null
    estimateWorkhours: Decimal | null
    projectStatusId: number | null
    is_deleted: boolean | null
    createdAt: Date | null
    createdBy: number | null
    updatedAt: Date | null
    updatedBy: number | null
  }

  export type FeatureCountAggregateOutputType = {
    id: number
    projectId: number
    name: number
    name_en: number
    status: number
    assetCaptureType: number
    backlogDescription: number
    startDate: number
    endDate: number
    completeDate: number
    estimateWorkhours: number
    projectStatusId: number
    is_deleted: number
    createdAt: number
    createdBy: number
    updatedAt: number
    updatedBy: number
    _all: number
  }


  export type FeatureAvgAggregateInputType = {
    id?: true
    projectId?: true
    estimateWorkhours?: true
    projectStatusId?: true
    createdBy?: true
    updatedBy?: true
  }

  export type FeatureSumAggregateInputType = {
    id?: true
    projectId?: true
    estimateWorkhours?: true
    projectStatusId?: true
    createdBy?: true
    updatedBy?: true
  }

  export type FeatureMinAggregateInputType = {
    id?: true
    projectId?: true
    name?: true
    name_en?: true
    status?: true
    assetCaptureType?: true
    startDate?: true
    endDate?: true
    completeDate?: true
    estimateWorkhours?: true
    projectStatusId?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type FeatureMaxAggregateInputType = {
    id?: true
    projectId?: true
    name?: true
    name_en?: true
    status?: true
    assetCaptureType?: true
    startDate?: true
    endDate?: true
    completeDate?: true
    estimateWorkhours?: true
    projectStatusId?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type FeatureCountAggregateInputType = {
    id?: true
    projectId?: true
    name?: true
    name_en?: true
    status?: true
    assetCaptureType?: true
    backlogDescription?: true
    startDate?: true
    endDate?: true
    completeDate?: true
    estimateWorkhours?: true
    projectStatusId?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
    _all?: true
  }

  export type FeatureAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Feature to aggregate.
     */
    where?: FeatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Features to fetch.
     */
    orderBy?: FeatureOrderByWithRelationInput | FeatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FeatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Features from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Features.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Features
    **/
    _count?: true | FeatureCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FeatureAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FeatureSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FeatureMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FeatureMaxAggregateInputType
  }

  export type GetFeatureAggregateType<T extends FeatureAggregateArgs> = {
        [P in keyof T & keyof AggregateFeature]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFeature[P]>
      : GetScalarType<T[P], AggregateFeature[P]>
  }




  export type FeatureGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FeatureWhereInput
    orderBy?: FeatureOrderByWithAggregationInput | FeatureOrderByWithAggregationInput[]
    by: FeatureScalarFieldEnum[] | FeatureScalarFieldEnum
    having?: FeatureScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FeatureCountAggregateInputType | true
    _avg?: FeatureAvgAggregateInputType
    _sum?: FeatureSumAggregateInputType
    _min?: FeatureMinAggregateInputType
    _max?: FeatureMaxAggregateInputType
  }

  export type FeatureGroupByOutputType = {
    id: number
    projectId: number
    name: string
    name_en: string | null
    status: string
    assetCaptureType: $Enums.ProjectAssetCaptureType
    backlogDescription: JsonValue | null
    startDate: Date | null
    endDate: Date | null
    completeDate: Date | null
    estimateWorkhours: Decimal | null
    projectStatusId: number | null
    is_deleted: boolean
    createdAt: Date
    createdBy: number | null
    updatedAt: Date
    updatedBy: number | null
    _count: FeatureCountAggregateOutputType | null
    _avg: FeatureAvgAggregateOutputType | null
    _sum: FeatureSumAggregateOutputType | null
    _min: FeatureMinAggregateOutputType | null
    _max: FeatureMaxAggregateOutputType | null
  }

  type GetFeatureGroupByPayload<T extends FeatureGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FeatureGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FeatureGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FeatureGroupByOutputType[P]>
            : GetScalarType<T[P], FeatureGroupByOutputType[P]>
        }
      >
    >


  export type FeatureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    name?: boolean
    name_en?: boolean
    status?: boolean
    assetCaptureType?: boolean
    backlogDescription?: boolean
    startDate?: boolean
    endDate?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    projectStatus?: boolean | Feature$projectStatusArgs<ExtArgs>
    projectAssignees?: boolean | Feature$projectAssigneesArgs<ExtArgs>
    timesheets?: boolean | Feature$timesheetsArgs<ExtArgs>
    _count?: boolean | FeatureCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["feature"]>

  export type FeatureSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    name?: boolean
    name_en?: boolean
    status?: boolean
    assetCaptureType?: boolean
    backlogDescription?: boolean
    startDate?: boolean
    endDate?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    projectStatus?: boolean | Feature$projectStatusArgs<ExtArgs>
  }, ExtArgs["result"]["feature"]>

  export type FeatureSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    name?: boolean
    name_en?: boolean
    status?: boolean
    assetCaptureType?: boolean
    backlogDescription?: boolean
    startDate?: boolean
    endDate?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    projectStatus?: boolean | Feature$projectStatusArgs<ExtArgs>
  }, ExtArgs["result"]["feature"]>

  export type FeatureSelectScalar = {
    id?: boolean
    projectId?: boolean
    name?: boolean
    name_en?: boolean
    status?: boolean
    assetCaptureType?: boolean
    backlogDescription?: boolean
    startDate?: boolean
    endDate?: boolean
    completeDate?: boolean
    estimateWorkhours?: boolean
    projectStatusId?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
  }

  export type FeatureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "name" | "name_en" | "status" | "assetCaptureType" | "backlogDescription" | "startDate" | "endDate" | "completeDate" | "estimateWorkhours" | "projectStatusId" | "is_deleted" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy", ExtArgs["result"]["feature"]>
  export type FeatureInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    projectStatus?: boolean | Feature$projectStatusArgs<ExtArgs>
    projectAssignees?: boolean | Feature$projectAssigneesArgs<ExtArgs>
    timesheets?: boolean | Feature$timesheetsArgs<ExtArgs>
    _count?: boolean | FeatureCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FeatureIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    projectStatus?: boolean | Feature$projectStatusArgs<ExtArgs>
  }
  export type FeatureIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    projectStatus?: boolean | Feature$projectStatusArgs<ExtArgs>
  }

  export type $FeaturePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Feature"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      projectStatus: Prisma.$ProjectStatusPayload<ExtArgs> | null
      projectAssignees: Prisma.$ProjectAssigneePayload<ExtArgs>[]
      timesheets: Prisma.$TimesheetEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      projectId: number
      name: string
      name_en: string | null
      status: string
      assetCaptureType: $Enums.ProjectAssetCaptureType
      backlogDescription: Prisma.JsonValue | null
      startDate: Date | null
      endDate: Date | null
      completeDate: Date | null
      estimateWorkhours: Prisma.Decimal | null
      projectStatusId: number | null
      is_deleted: boolean
      createdAt: Date
      createdBy: number | null
      updatedAt: Date
      updatedBy: number | null
    }, ExtArgs["result"]["feature"]>
    composites: {}
  }

  type FeatureGetPayload<S extends boolean | null | undefined | FeatureDefaultArgs> = $Result.GetResult<Prisma.$FeaturePayload, S>

  type FeatureCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FeatureFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FeatureCountAggregateInputType | true
    }

  export interface FeatureDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Feature'], meta: { name: 'Feature' } }
    /**
     * Find zero or one Feature that matches the filter.
     * @param {FeatureFindUniqueArgs} args - Arguments to find a Feature
     * @example
     * // Get one Feature
     * const feature = await prisma.feature.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FeatureFindUniqueArgs>(args: SelectSubset<T, FeatureFindUniqueArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Feature that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FeatureFindUniqueOrThrowArgs} args - Arguments to find a Feature
     * @example
     * // Get one Feature
     * const feature = await prisma.feature.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FeatureFindUniqueOrThrowArgs>(args: SelectSubset<T, FeatureFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Feature that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureFindFirstArgs} args - Arguments to find a Feature
     * @example
     * // Get one Feature
     * const feature = await prisma.feature.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FeatureFindFirstArgs>(args?: SelectSubset<T, FeatureFindFirstArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Feature that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureFindFirstOrThrowArgs} args - Arguments to find a Feature
     * @example
     * // Get one Feature
     * const feature = await prisma.feature.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FeatureFindFirstOrThrowArgs>(args?: SelectSubset<T, FeatureFindFirstOrThrowArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Features that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Features
     * const features = await prisma.feature.findMany()
     * 
     * // Get first 10 Features
     * const features = await prisma.feature.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const featureWithIdOnly = await prisma.feature.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FeatureFindManyArgs>(args?: SelectSubset<T, FeatureFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Feature.
     * @param {FeatureCreateArgs} args - Arguments to create a Feature.
     * @example
     * // Create one Feature
     * const Feature = await prisma.feature.create({
     *   data: {
     *     // ... data to create a Feature
     *   }
     * })
     * 
     */
    create<T extends FeatureCreateArgs>(args: SelectSubset<T, FeatureCreateArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Features.
     * @param {FeatureCreateManyArgs} args - Arguments to create many Features.
     * @example
     * // Create many Features
     * const feature = await prisma.feature.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FeatureCreateManyArgs>(args?: SelectSubset<T, FeatureCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Features and returns the data saved in the database.
     * @param {FeatureCreateManyAndReturnArgs} args - Arguments to create many Features.
     * @example
     * // Create many Features
     * const feature = await prisma.feature.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Features and only return the `id`
     * const featureWithIdOnly = await prisma.feature.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FeatureCreateManyAndReturnArgs>(args?: SelectSubset<T, FeatureCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Feature.
     * @param {FeatureDeleteArgs} args - Arguments to delete one Feature.
     * @example
     * // Delete one Feature
     * const Feature = await prisma.feature.delete({
     *   where: {
     *     // ... filter to delete one Feature
     *   }
     * })
     * 
     */
    delete<T extends FeatureDeleteArgs>(args: SelectSubset<T, FeatureDeleteArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Feature.
     * @param {FeatureUpdateArgs} args - Arguments to update one Feature.
     * @example
     * // Update one Feature
     * const feature = await prisma.feature.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FeatureUpdateArgs>(args: SelectSubset<T, FeatureUpdateArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Features.
     * @param {FeatureDeleteManyArgs} args - Arguments to filter Features to delete.
     * @example
     * // Delete a few Features
     * const { count } = await prisma.feature.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FeatureDeleteManyArgs>(args?: SelectSubset<T, FeatureDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Features.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Features
     * const feature = await prisma.feature.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FeatureUpdateManyArgs>(args: SelectSubset<T, FeatureUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Features and returns the data updated in the database.
     * @param {FeatureUpdateManyAndReturnArgs} args - Arguments to update many Features.
     * @example
     * // Update many Features
     * const feature = await prisma.feature.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Features and only return the `id`
     * const featureWithIdOnly = await prisma.feature.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FeatureUpdateManyAndReturnArgs>(args: SelectSubset<T, FeatureUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Feature.
     * @param {FeatureUpsertArgs} args - Arguments to update or create a Feature.
     * @example
     * // Update or create a Feature
     * const feature = await prisma.feature.upsert({
     *   create: {
     *     // ... data to create a Feature
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Feature we want to update
     *   }
     * })
     */
    upsert<T extends FeatureUpsertArgs>(args: SelectSubset<T, FeatureUpsertArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Features.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureCountArgs} args - Arguments to filter Features to count.
     * @example
     * // Count the number of Features
     * const count = await prisma.feature.count({
     *   where: {
     *     // ... the filter for the Features we want to count
     *   }
     * })
    **/
    count<T extends FeatureCountArgs>(
      args?: Subset<T, FeatureCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FeatureCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Feature.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FeatureAggregateArgs>(args: Subset<T, FeatureAggregateArgs>): Prisma.PrismaPromise<GetFeatureAggregateType<T>>

    /**
     * Group by Feature.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeatureGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FeatureGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FeatureGroupByArgs['orderBy'] }
        : { orderBy?: FeatureGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FeatureGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFeatureGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Feature model
   */
  readonly fields: FeatureFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Feature.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FeatureClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    projectStatus<T extends Feature$projectStatusArgs<ExtArgs> = {}>(args?: Subset<T, Feature$projectStatusArgs<ExtArgs>>): Prisma__ProjectStatusClient<$Result.GetResult<Prisma.$ProjectStatusPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    projectAssignees<T extends Feature$projectAssigneesArgs<ExtArgs> = {}>(args?: Subset<T, Feature$projectAssigneesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    timesheets<T extends Feature$timesheetsArgs<ExtArgs> = {}>(args?: Subset<T, Feature$timesheetsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Feature model
   */
  interface FeatureFieldRefs {
    readonly id: FieldRef<"Feature", 'Int'>
    readonly projectId: FieldRef<"Feature", 'Int'>
    readonly name: FieldRef<"Feature", 'String'>
    readonly name_en: FieldRef<"Feature", 'String'>
    readonly status: FieldRef<"Feature", 'String'>
    readonly assetCaptureType: FieldRef<"Feature", 'ProjectAssetCaptureType'>
    readonly backlogDescription: FieldRef<"Feature", 'Json'>
    readonly startDate: FieldRef<"Feature", 'DateTime'>
    readonly endDate: FieldRef<"Feature", 'DateTime'>
    readonly completeDate: FieldRef<"Feature", 'DateTime'>
    readonly estimateWorkhours: FieldRef<"Feature", 'Decimal'>
    readonly projectStatusId: FieldRef<"Feature", 'Int'>
    readonly is_deleted: FieldRef<"Feature", 'Boolean'>
    readonly createdAt: FieldRef<"Feature", 'DateTime'>
    readonly createdBy: FieldRef<"Feature", 'Int'>
    readonly updatedAt: FieldRef<"Feature", 'DateTime'>
    readonly updatedBy: FieldRef<"Feature", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Feature findUnique
   */
  export type FeatureFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * Filter, which Feature to fetch.
     */
    where: FeatureWhereUniqueInput
  }

  /**
   * Feature findUniqueOrThrow
   */
  export type FeatureFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * Filter, which Feature to fetch.
     */
    where: FeatureWhereUniqueInput
  }

  /**
   * Feature findFirst
   */
  export type FeatureFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * Filter, which Feature to fetch.
     */
    where?: FeatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Features to fetch.
     */
    orderBy?: FeatureOrderByWithRelationInput | FeatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Features.
     */
    cursor?: FeatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Features from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Features.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Features.
     */
    distinct?: FeatureScalarFieldEnum | FeatureScalarFieldEnum[]
  }

  /**
   * Feature findFirstOrThrow
   */
  export type FeatureFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * Filter, which Feature to fetch.
     */
    where?: FeatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Features to fetch.
     */
    orderBy?: FeatureOrderByWithRelationInput | FeatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Features.
     */
    cursor?: FeatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Features from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Features.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Features.
     */
    distinct?: FeatureScalarFieldEnum | FeatureScalarFieldEnum[]
  }

  /**
   * Feature findMany
   */
  export type FeatureFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * Filter, which Features to fetch.
     */
    where?: FeatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Features to fetch.
     */
    orderBy?: FeatureOrderByWithRelationInput | FeatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Features.
     */
    cursor?: FeatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Features from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Features.
     */
    skip?: number
    distinct?: FeatureScalarFieldEnum | FeatureScalarFieldEnum[]
  }

  /**
   * Feature create
   */
  export type FeatureCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * The data needed to create a Feature.
     */
    data: XOR<FeatureCreateInput, FeatureUncheckedCreateInput>
  }

  /**
   * Feature createMany
   */
  export type FeatureCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Features.
     */
    data: FeatureCreateManyInput | FeatureCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Feature createManyAndReturn
   */
  export type FeatureCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * The data used to create many Features.
     */
    data: FeatureCreateManyInput | FeatureCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Feature update
   */
  export type FeatureUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * The data needed to update a Feature.
     */
    data: XOR<FeatureUpdateInput, FeatureUncheckedUpdateInput>
    /**
     * Choose, which Feature to update.
     */
    where: FeatureWhereUniqueInput
  }

  /**
   * Feature updateMany
   */
  export type FeatureUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Features.
     */
    data: XOR<FeatureUpdateManyMutationInput, FeatureUncheckedUpdateManyInput>
    /**
     * Filter which Features to update
     */
    where?: FeatureWhereInput
    /**
     * Limit how many Features to update.
     */
    limit?: number
  }

  /**
   * Feature updateManyAndReturn
   */
  export type FeatureUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * The data used to update Features.
     */
    data: XOR<FeatureUpdateManyMutationInput, FeatureUncheckedUpdateManyInput>
    /**
     * Filter which Features to update
     */
    where?: FeatureWhereInput
    /**
     * Limit how many Features to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Feature upsert
   */
  export type FeatureUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * The filter to search for the Feature to update in case it exists.
     */
    where: FeatureWhereUniqueInput
    /**
     * In case the Feature found by the `where` argument doesn't exist, create a new Feature with this data.
     */
    create: XOR<FeatureCreateInput, FeatureUncheckedCreateInput>
    /**
     * In case the Feature was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FeatureUpdateInput, FeatureUncheckedUpdateInput>
  }

  /**
   * Feature delete
   */
  export type FeatureDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    /**
     * Filter which Feature to delete.
     */
    where: FeatureWhereUniqueInput
  }

  /**
   * Feature deleteMany
   */
  export type FeatureDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Features to delete
     */
    where?: FeatureWhereInput
    /**
     * Limit how many Features to delete.
     */
    limit?: number
  }

  /**
   * Feature.projectStatus
   */
  export type Feature$projectStatusArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectStatus
     */
    select?: ProjectStatusSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectStatus
     */
    omit?: ProjectStatusOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectStatusInclude<ExtArgs> | null
    where?: ProjectStatusWhereInput
  }

  /**
   * Feature.projectAssignees
   */
  export type Feature$projectAssigneesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    where?: ProjectAssigneeWhereInput
    orderBy?: ProjectAssigneeOrderByWithRelationInput | ProjectAssigneeOrderByWithRelationInput[]
    cursor?: ProjectAssigneeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProjectAssigneeScalarFieldEnum | ProjectAssigneeScalarFieldEnum[]
  }

  /**
   * Feature.timesheets
   */
  export type Feature$timesheetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    where?: TimesheetEntryWhereInput
    orderBy?: TimesheetEntryOrderByWithRelationInput | TimesheetEntryOrderByWithRelationInput[]
    cursor?: TimesheetEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TimesheetEntryScalarFieldEnum | TimesheetEntryScalarFieldEnum[]
  }

  /**
   * Feature without action
   */
  export type FeatureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
  }


  /**
   * Model ProjectAssignee
   */

  export type AggregateProjectAssignee = {
    _count: ProjectAssigneeCountAggregateOutputType | null
    _avg: ProjectAssigneeAvgAggregateOutputType | null
    _sum: ProjectAssigneeSumAggregateOutputType | null
    _min: ProjectAssigneeMinAggregateOutputType | null
    _max: ProjectAssigneeMaxAggregateOutputType | null
  }

  export type ProjectAssigneeAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    projectId: number | null
    featureId: number | null
  }

  export type ProjectAssigneeSumAggregateOutputType = {
    id: number | null
    userId: number | null
    projectId: number | null
    featureId: number | null
  }

  export type ProjectAssigneeMinAggregateOutputType = {
    id: number | null
    userId: number | null
    projectId: number | null
    featureId: number | null
    position: string | null
  }

  export type ProjectAssigneeMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    projectId: number | null
    featureId: number | null
    position: string | null
  }

  export type ProjectAssigneeCountAggregateOutputType = {
    id: number
    userId: number
    projectId: number
    featureId: number
    position: number
    _all: number
  }


  export type ProjectAssigneeAvgAggregateInputType = {
    id?: true
    userId?: true
    projectId?: true
    featureId?: true
  }

  export type ProjectAssigneeSumAggregateInputType = {
    id?: true
    userId?: true
    projectId?: true
    featureId?: true
  }

  export type ProjectAssigneeMinAggregateInputType = {
    id?: true
    userId?: true
    projectId?: true
    featureId?: true
    position?: true
  }

  export type ProjectAssigneeMaxAggregateInputType = {
    id?: true
    userId?: true
    projectId?: true
    featureId?: true
    position?: true
  }

  export type ProjectAssigneeCountAggregateInputType = {
    id?: true
    userId?: true
    projectId?: true
    featureId?: true
    position?: true
    _all?: true
  }

  export type ProjectAssigneeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProjectAssignee to aggregate.
     */
    where?: ProjectAssigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectAssignees to fetch.
     */
    orderBy?: ProjectAssigneeOrderByWithRelationInput | ProjectAssigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProjectAssigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectAssignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectAssignees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProjectAssignees
    **/
    _count?: true | ProjectAssigneeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProjectAssigneeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProjectAssigneeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProjectAssigneeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProjectAssigneeMaxAggregateInputType
  }

  export type GetProjectAssigneeAggregateType<T extends ProjectAssigneeAggregateArgs> = {
        [P in keyof T & keyof AggregateProjectAssignee]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProjectAssignee[P]>
      : GetScalarType<T[P], AggregateProjectAssignee[P]>
  }




  export type ProjectAssigneeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProjectAssigneeWhereInput
    orderBy?: ProjectAssigneeOrderByWithAggregationInput | ProjectAssigneeOrderByWithAggregationInput[]
    by: ProjectAssigneeScalarFieldEnum[] | ProjectAssigneeScalarFieldEnum
    having?: ProjectAssigneeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProjectAssigneeCountAggregateInputType | true
    _avg?: ProjectAssigneeAvgAggregateInputType
    _sum?: ProjectAssigneeSumAggregateInputType
    _min?: ProjectAssigneeMinAggregateInputType
    _max?: ProjectAssigneeMaxAggregateInputType
  }

  export type ProjectAssigneeGroupByOutputType = {
    id: number
    userId: number
    projectId: number
    featureId: number | null
    position: string | null
    _count: ProjectAssigneeCountAggregateOutputType | null
    _avg: ProjectAssigneeAvgAggregateOutputType | null
    _sum: ProjectAssigneeSumAggregateOutputType | null
    _min: ProjectAssigneeMinAggregateOutputType | null
    _max: ProjectAssigneeMaxAggregateOutputType | null
  }

  type GetProjectAssigneeGroupByPayload<T extends ProjectAssigneeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProjectAssigneeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProjectAssigneeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProjectAssigneeGroupByOutputType[P]>
            : GetScalarType<T[P], ProjectAssigneeGroupByOutputType[P]>
        }
      >
    >


  export type ProjectAssigneeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    projectId?: boolean
    featureId?: boolean
    position?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    feature?: boolean | ProjectAssignee$featureArgs<ExtArgs>
  }, ExtArgs["result"]["projectAssignee"]>

  export type ProjectAssigneeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    projectId?: boolean
    featureId?: boolean
    position?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    feature?: boolean | ProjectAssignee$featureArgs<ExtArgs>
  }, ExtArgs["result"]["projectAssignee"]>

  export type ProjectAssigneeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    projectId?: boolean
    featureId?: boolean
    position?: boolean
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    feature?: boolean | ProjectAssignee$featureArgs<ExtArgs>
  }, ExtArgs["result"]["projectAssignee"]>

  export type ProjectAssigneeSelectScalar = {
    id?: boolean
    userId?: boolean
    projectId?: boolean
    featureId?: boolean
    position?: boolean
  }

  export type ProjectAssigneeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "projectId" | "featureId" | "position", ExtArgs["result"]["projectAssignee"]>
  export type ProjectAssigneeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    feature?: boolean | ProjectAssignee$featureArgs<ExtArgs>
  }
  export type ProjectAssigneeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    feature?: boolean | ProjectAssignee$featureArgs<ExtArgs>
  }
  export type ProjectAssigneeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | ProjectDefaultArgs<ExtArgs>
    feature?: boolean | ProjectAssignee$featureArgs<ExtArgs>
  }

  export type $ProjectAssigneePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProjectAssignee"
    objects: {
      project: Prisma.$ProjectPayload<ExtArgs>
      feature: Prisma.$FeaturePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      projectId: number
      featureId: number | null
      position: string | null
    }, ExtArgs["result"]["projectAssignee"]>
    composites: {}
  }

  type ProjectAssigneeGetPayload<S extends boolean | null | undefined | ProjectAssigneeDefaultArgs> = $Result.GetResult<Prisma.$ProjectAssigneePayload, S>

  type ProjectAssigneeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProjectAssigneeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProjectAssigneeCountAggregateInputType | true
    }

  export interface ProjectAssigneeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProjectAssignee'], meta: { name: 'ProjectAssignee' } }
    /**
     * Find zero or one ProjectAssignee that matches the filter.
     * @param {ProjectAssigneeFindUniqueArgs} args - Arguments to find a ProjectAssignee
     * @example
     * // Get one ProjectAssignee
     * const projectAssignee = await prisma.projectAssignee.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProjectAssigneeFindUniqueArgs>(args: SelectSubset<T, ProjectAssigneeFindUniqueArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProjectAssignee that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProjectAssigneeFindUniqueOrThrowArgs} args - Arguments to find a ProjectAssignee
     * @example
     * // Get one ProjectAssignee
     * const projectAssignee = await prisma.projectAssignee.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProjectAssigneeFindUniqueOrThrowArgs>(args: SelectSubset<T, ProjectAssigneeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProjectAssignee that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeFindFirstArgs} args - Arguments to find a ProjectAssignee
     * @example
     * // Get one ProjectAssignee
     * const projectAssignee = await prisma.projectAssignee.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProjectAssigneeFindFirstArgs>(args?: SelectSubset<T, ProjectAssigneeFindFirstArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProjectAssignee that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeFindFirstOrThrowArgs} args - Arguments to find a ProjectAssignee
     * @example
     * // Get one ProjectAssignee
     * const projectAssignee = await prisma.projectAssignee.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProjectAssigneeFindFirstOrThrowArgs>(args?: SelectSubset<T, ProjectAssigneeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProjectAssignees that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProjectAssignees
     * const projectAssignees = await prisma.projectAssignee.findMany()
     * 
     * // Get first 10 ProjectAssignees
     * const projectAssignees = await prisma.projectAssignee.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const projectAssigneeWithIdOnly = await prisma.projectAssignee.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProjectAssigneeFindManyArgs>(args?: SelectSubset<T, ProjectAssigneeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProjectAssignee.
     * @param {ProjectAssigneeCreateArgs} args - Arguments to create a ProjectAssignee.
     * @example
     * // Create one ProjectAssignee
     * const ProjectAssignee = await prisma.projectAssignee.create({
     *   data: {
     *     // ... data to create a ProjectAssignee
     *   }
     * })
     * 
     */
    create<T extends ProjectAssigneeCreateArgs>(args: SelectSubset<T, ProjectAssigneeCreateArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProjectAssignees.
     * @param {ProjectAssigneeCreateManyArgs} args - Arguments to create many ProjectAssignees.
     * @example
     * // Create many ProjectAssignees
     * const projectAssignee = await prisma.projectAssignee.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProjectAssigneeCreateManyArgs>(args?: SelectSubset<T, ProjectAssigneeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProjectAssignees and returns the data saved in the database.
     * @param {ProjectAssigneeCreateManyAndReturnArgs} args - Arguments to create many ProjectAssignees.
     * @example
     * // Create many ProjectAssignees
     * const projectAssignee = await prisma.projectAssignee.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProjectAssignees and only return the `id`
     * const projectAssigneeWithIdOnly = await prisma.projectAssignee.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProjectAssigneeCreateManyAndReturnArgs>(args?: SelectSubset<T, ProjectAssigneeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProjectAssignee.
     * @param {ProjectAssigneeDeleteArgs} args - Arguments to delete one ProjectAssignee.
     * @example
     * // Delete one ProjectAssignee
     * const ProjectAssignee = await prisma.projectAssignee.delete({
     *   where: {
     *     // ... filter to delete one ProjectAssignee
     *   }
     * })
     * 
     */
    delete<T extends ProjectAssigneeDeleteArgs>(args: SelectSubset<T, ProjectAssigneeDeleteArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProjectAssignee.
     * @param {ProjectAssigneeUpdateArgs} args - Arguments to update one ProjectAssignee.
     * @example
     * // Update one ProjectAssignee
     * const projectAssignee = await prisma.projectAssignee.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProjectAssigneeUpdateArgs>(args: SelectSubset<T, ProjectAssigneeUpdateArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProjectAssignees.
     * @param {ProjectAssigneeDeleteManyArgs} args - Arguments to filter ProjectAssignees to delete.
     * @example
     * // Delete a few ProjectAssignees
     * const { count } = await prisma.projectAssignee.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProjectAssigneeDeleteManyArgs>(args?: SelectSubset<T, ProjectAssigneeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProjectAssignees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProjectAssignees
     * const projectAssignee = await prisma.projectAssignee.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProjectAssigneeUpdateManyArgs>(args: SelectSubset<T, ProjectAssigneeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProjectAssignees and returns the data updated in the database.
     * @param {ProjectAssigneeUpdateManyAndReturnArgs} args - Arguments to update many ProjectAssignees.
     * @example
     * // Update many ProjectAssignees
     * const projectAssignee = await prisma.projectAssignee.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProjectAssignees and only return the `id`
     * const projectAssigneeWithIdOnly = await prisma.projectAssignee.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProjectAssigneeUpdateManyAndReturnArgs>(args: SelectSubset<T, ProjectAssigneeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProjectAssignee.
     * @param {ProjectAssigneeUpsertArgs} args - Arguments to update or create a ProjectAssignee.
     * @example
     * // Update or create a ProjectAssignee
     * const projectAssignee = await prisma.projectAssignee.upsert({
     *   create: {
     *     // ... data to create a ProjectAssignee
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProjectAssignee we want to update
     *   }
     * })
     */
    upsert<T extends ProjectAssigneeUpsertArgs>(args: SelectSubset<T, ProjectAssigneeUpsertArgs<ExtArgs>>): Prisma__ProjectAssigneeClient<$Result.GetResult<Prisma.$ProjectAssigneePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProjectAssignees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeCountArgs} args - Arguments to filter ProjectAssignees to count.
     * @example
     * // Count the number of ProjectAssignees
     * const count = await prisma.projectAssignee.count({
     *   where: {
     *     // ... the filter for the ProjectAssignees we want to count
     *   }
     * })
    **/
    count<T extends ProjectAssigneeCountArgs>(
      args?: Subset<T, ProjectAssigneeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProjectAssigneeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProjectAssignee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProjectAssigneeAggregateArgs>(args: Subset<T, ProjectAssigneeAggregateArgs>): Prisma.PrismaPromise<GetProjectAssigneeAggregateType<T>>

    /**
     * Group by ProjectAssignee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProjectAssigneeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProjectAssigneeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProjectAssigneeGroupByArgs['orderBy'] }
        : { orderBy?: ProjectAssigneeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProjectAssigneeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProjectAssigneeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProjectAssignee model
   */
  readonly fields: ProjectAssigneeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProjectAssignee.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProjectAssigneeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    feature<T extends ProjectAssignee$featureArgs<ExtArgs> = {}>(args?: Subset<T, ProjectAssignee$featureArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProjectAssignee model
   */
  interface ProjectAssigneeFieldRefs {
    readonly id: FieldRef<"ProjectAssignee", 'Int'>
    readonly userId: FieldRef<"ProjectAssignee", 'Int'>
    readonly projectId: FieldRef<"ProjectAssignee", 'Int'>
    readonly featureId: FieldRef<"ProjectAssignee", 'Int'>
    readonly position: FieldRef<"ProjectAssignee", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ProjectAssignee findUnique
   */
  export type ProjectAssigneeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * Filter, which ProjectAssignee to fetch.
     */
    where: ProjectAssigneeWhereUniqueInput
  }

  /**
   * ProjectAssignee findUniqueOrThrow
   */
  export type ProjectAssigneeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * Filter, which ProjectAssignee to fetch.
     */
    where: ProjectAssigneeWhereUniqueInput
  }

  /**
   * ProjectAssignee findFirst
   */
  export type ProjectAssigneeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * Filter, which ProjectAssignee to fetch.
     */
    where?: ProjectAssigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectAssignees to fetch.
     */
    orderBy?: ProjectAssigneeOrderByWithRelationInput | ProjectAssigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProjectAssignees.
     */
    cursor?: ProjectAssigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectAssignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectAssignees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProjectAssignees.
     */
    distinct?: ProjectAssigneeScalarFieldEnum | ProjectAssigneeScalarFieldEnum[]
  }

  /**
   * ProjectAssignee findFirstOrThrow
   */
  export type ProjectAssigneeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * Filter, which ProjectAssignee to fetch.
     */
    where?: ProjectAssigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectAssignees to fetch.
     */
    orderBy?: ProjectAssigneeOrderByWithRelationInput | ProjectAssigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProjectAssignees.
     */
    cursor?: ProjectAssigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectAssignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectAssignees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProjectAssignees.
     */
    distinct?: ProjectAssigneeScalarFieldEnum | ProjectAssigneeScalarFieldEnum[]
  }

  /**
   * ProjectAssignee findMany
   */
  export type ProjectAssigneeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * Filter, which ProjectAssignees to fetch.
     */
    where?: ProjectAssigneeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProjectAssignees to fetch.
     */
    orderBy?: ProjectAssigneeOrderByWithRelationInput | ProjectAssigneeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProjectAssignees.
     */
    cursor?: ProjectAssigneeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProjectAssignees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProjectAssignees.
     */
    skip?: number
    distinct?: ProjectAssigneeScalarFieldEnum | ProjectAssigneeScalarFieldEnum[]
  }

  /**
   * ProjectAssignee create
   */
  export type ProjectAssigneeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * The data needed to create a ProjectAssignee.
     */
    data: XOR<ProjectAssigneeCreateInput, ProjectAssigneeUncheckedCreateInput>
  }

  /**
   * ProjectAssignee createMany
   */
  export type ProjectAssigneeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProjectAssignees.
     */
    data: ProjectAssigneeCreateManyInput | ProjectAssigneeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProjectAssignee createManyAndReturn
   */
  export type ProjectAssigneeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * The data used to create many ProjectAssignees.
     */
    data: ProjectAssigneeCreateManyInput | ProjectAssigneeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProjectAssignee update
   */
  export type ProjectAssigneeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * The data needed to update a ProjectAssignee.
     */
    data: XOR<ProjectAssigneeUpdateInput, ProjectAssigneeUncheckedUpdateInput>
    /**
     * Choose, which ProjectAssignee to update.
     */
    where: ProjectAssigneeWhereUniqueInput
  }

  /**
   * ProjectAssignee updateMany
   */
  export type ProjectAssigneeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProjectAssignees.
     */
    data: XOR<ProjectAssigneeUpdateManyMutationInput, ProjectAssigneeUncheckedUpdateManyInput>
    /**
     * Filter which ProjectAssignees to update
     */
    where?: ProjectAssigneeWhereInput
    /**
     * Limit how many ProjectAssignees to update.
     */
    limit?: number
  }

  /**
   * ProjectAssignee updateManyAndReturn
   */
  export type ProjectAssigneeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * The data used to update ProjectAssignees.
     */
    data: XOR<ProjectAssigneeUpdateManyMutationInput, ProjectAssigneeUncheckedUpdateManyInput>
    /**
     * Filter which ProjectAssignees to update
     */
    where?: ProjectAssigneeWhereInput
    /**
     * Limit how many ProjectAssignees to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProjectAssignee upsert
   */
  export type ProjectAssigneeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * The filter to search for the ProjectAssignee to update in case it exists.
     */
    where: ProjectAssigneeWhereUniqueInput
    /**
     * In case the ProjectAssignee found by the `where` argument doesn't exist, create a new ProjectAssignee with this data.
     */
    create: XOR<ProjectAssigneeCreateInput, ProjectAssigneeUncheckedCreateInput>
    /**
     * In case the ProjectAssignee was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProjectAssigneeUpdateInput, ProjectAssigneeUncheckedUpdateInput>
  }

  /**
   * ProjectAssignee delete
   */
  export type ProjectAssigneeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
    /**
     * Filter which ProjectAssignee to delete.
     */
    where: ProjectAssigneeWhereUniqueInput
  }

  /**
   * ProjectAssignee deleteMany
   */
  export type ProjectAssigneeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProjectAssignees to delete
     */
    where?: ProjectAssigneeWhereInput
    /**
     * Limit how many ProjectAssignees to delete.
     */
    limit?: number
  }

  /**
   * ProjectAssignee.feature
   */
  export type ProjectAssignee$featureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Feature
     */
    select?: FeatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Feature
     */
    omit?: FeatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeatureInclude<ExtArgs> | null
    where?: FeatureWhereInput
  }

  /**
   * ProjectAssignee without action
   */
  export type ProjectAssigneeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProjectAssignee
     */
    select?: ProjectAssigneeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProjectAssignee
     */
    omit?: ProjectAssigneeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProjectAssigneeInclude<ExtArgs> | null
  }


  /**
   * Model TimesheetEntry
   */

  export type AggregateTimesheetEntry = {
    _count: TimesheetEntryCountAggregateOutputType | null
    _avg: TimesheetEntryAvgAggregateOutputType | null
    _sum: TimesheetEntrySumAggregateOutputType | null
    _min: TimesheetEntryMinAggregateOutputType | null
    _max: TimesheetEntryMaxAggregateOutputType | null
  }

  export type TimesheetEntryAvgAggregateOutputType = {
    id: number | null
    projectId: number | null
    featureId: number | null
    hours: Decimal | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type TimesheetEntrySumAggregateOutputType = {
    id: number | null
    projectId: number | null
    featureId: number | null
    hours: Decimal | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type TimesheetEntryMinAggregateOutputType = {
    id: number | null
    projectId: number | null
    featureId: number | null
    date: Date | null
    hours: Decimal | null
    description: string | null
    status: string | null
    is_deleted: boolean | null
    createdAt: Date | null
    createdBy: number | null
    updatedAt: Date | null
    updatedBy: number | null
  }

  export type TimesheetEntryMaxAggregateOutputType = {
    id: number | null
    projectId: number | null
    featureId: number | null
    date: Date | null
    hours: Decimal | null
    description: string | null
    status: string | null
    is_deleted: boolean | null
    createdAt: Date | null
    createdBy: number | null
    updatedAt: Date | null
    updatedBy: number | null
  }

  export type TimesheetEntryCountAggregateOutputType = {
    id: number
    projectId: number
    featureId: number
    date: number
    hours: number
    description: number
    status: number
    is_deleted: number
    createdAt: number
    createdBy: number
    updatedAt: number
    updatedBy: number
    _all: number
  }


  export type TimesheetEntryAvgAggregateInputType = {
    id?: true
    projectId?: true
    featureId?: true
    hours?: true
    createdBy?: true
    updatedBy?: true
  }

  export type TimesheetEntrySumAggregateInputType = {
    id?: true
    projectId?: true
    featureId?: true
    hours?: true
    createdBy?: true
    updatedBy?: true
  }

  export type TimesheetEntryMinAggregateInputType = {
    id?: true
    projectId?: true
    featureId?: true
    date?: true
    hours?: true
    description?: true
    status?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type TimesheetEntryMaxAggregateInputType = {
    id?: true
    projectId?: true
    featureId?: true
    date?: true
    hours?: true
    description?: true
    status?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type TimesheetEntryCountAggregateInputType = {
    id?: true
    projectId?: true
    featureId?: true
    date?: true
    hours?: true
    description?: true
    status?: true
    is_deleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
    _all?: true
  }

  export type TimesheetEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TimesheetEntry to aggregate.
     */
    where?: TimesheetEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimesheetEntries to fetch.
     */
    orderBy?: TimesheetEntryOrderByWithRelationInput | TimesheetEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TimesheetEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimesheetEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimesheetEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TimesheetEntries
    **/
    _count?: true | TimesheetEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TimesheetEntryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TimesheetEntrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TimesheetEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TimesheetEntryMaxAggregateInputType
  }

  export type GetTimesheetEntryAggregateType<T extends TimesheetEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateTimesheetEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTimesheetEntry[P]>
      : GetScalarType<T[P], AggregateTimesheetEntry[P]>
  }




  export type TimesheetEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimesheetEntryWhereInput
    orderBy?: TimesheetEntryOrderByWithAggregationInput | TimesheetEntryOrderByWithAggregationInput[]
    by: TimesheetEntryScalarFieldEnum[] | TimesheetEntryScalarFieldEnum
    having?: TimesheetEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TimesheetEntryCountAggregateInputType | true
    _avg?: TimesheetEntryAvgAggregateInputType
    _sum?: TimesheetEntrySumAggregateInputType
    _min?: TimesheetEntryMinAggregateInputType
    _max?: TimesheetEntryMaxAggregateInputType
  }

  export type TimesheetEntryGroupByOutputType = {
    id: number
    projectId: number
    featureId: number
    date: Date
    hours: Decimal
    description: string | null
    status: string
    is_deleted: boolean
    createdAt: Date
    createdBy: number | null
    updatedAt: Date
    updatedBy: number | null
    _count: TimesheetEntryCountAggregateOutputType | null
    _avg: TimesheetEntryAvgAggregateOutputType | null
    _sum: TimesheetEntrySumAggregateOutputType | null
    _min: TimesheetEntryMinAggregateOutputType | null
    _max: TimesheetEntryMaxAggregateOutputType | null
  }

  type GetTimesheetEntryGroupByPayload<T extends TimesheetEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TimesheetEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TimesheetEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TimesheetEntryGroupByOutputType[P]>
            : GetScalarType<T[P], TimesheetEntryGroupByOutputType[P]>
        }
      >
    >


  export type TimesheetEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    featureId?: boolean
    date?: boolean
    hours?: boolean
    description?: boolean
    status?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    feature?: boolean | FeatureDefaultArgs<ExtArgs>
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["timesheetEntry"]>

  export type TimesheetEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    featureId?: boolean
    date?: boolean
    hours?: boolean
    description?: boolean
    status?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    feature?: boolean | FeatureDefaultArgs<ExtArgs>
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["timesheetEntry"]>

  export type TimesheetEntrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    featureId?: boolean
    date?: boolean
    hours?: boolean
    description?: boolean
    status?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    feature?: boolean | FeatureDefaultArgs<ExtArgs>
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["timesheetEntry"]>

  export type TimesheetEntrySelectScalar = {
    id?: boolean
    projectId?: boolean
    featureId?: boolean
    date?: boolean
    hours?: boolean
    description?: boolean
    status?: boolean
    is_deleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
  }

  export type TimesheetEntryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "featureId" | "date" | "hours" | "description" | "status" | "is_deleted" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy", ExtArgs["result"]["timesheetEntry"]>
  export type TimesheetEntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    feature?: boolean | FeatureDefaultArgs<ExtArgs>
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type TimesheetEntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    feature?: boolean | FeatureDefaultArgs<ExtArgs>
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }
  export type TimesheetEntryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    feature?: boolean | FeatureDefaultArgs<ExtArgs>
    project?: boolean | ProjectDefaultArgs<ExtArgs>
  }

  export type $TimesheetEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TimesheetEntry"
    objects: {
      feature: Prisma.$FeaturePayload<ExtArgs>
      project: Prisma.$ProjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      projectId: number
      featureId: number
      date: Date
      hours: Prisma.Decimal
      description: string | null
      status: string
      is_deleted: boolean
      createdAt: Date
      createdBy: number | null
      updatedAt: Date
      updatedBy: number | null
    }, ExtArgs["result"]["timesheetEntry"]>
    composites: {}
  }

  type TimesheetEntryGetPayload<S extends boolean | null | undefined | TimesheetEntryDefaultArgs> = $Result.GetResult<Prisma.$TimesheetEntryPayload, S>

  type TimesheetEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TimesheetEntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TimesheetEntryCountAggregateInputType | true
    }

  export interface TimesheetEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TimesheetEntry'], meta: { name: 'TimesheetEntry' } }
    /**
     * Find zero or one TimesheetEntry that matches the filter.
     * @param {TimesheetEntryFindUniqueArgs} args - Arguments to find a TimesheetEntry
     * @example
     * // Get one TimesheetEntry
     * const timesheetEntry = await prisma.timesheetEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TimesheetEntryFindUniqueArgs>(args: SelectSubset<T, TimesheetEntryFindUniqueArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TimesheetEntry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TimesheetEntryFindUniqueOrThrowArgs} args - Arguments to find a TimesheetEntry
     * @example
     * // Get one TimesheetEntry
     * const timesheetEntry = await prisma.timesheetEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TimesheetEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, TimesheetEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TimesheetEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryFindFirstArgs} args - Arguments to find a TimesheetEntry
     * @example
     * // Get one TimesheetEntry
     * const timesheetEntry = await prisma.timesheetEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TimesheetEntryFindFirstArgs>(args?: SelectSubset<T, TimesheetEntryFindFirstArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TimesheetEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryFindFirstOrThrowArgs} args - Arguments to find a TimesheetEntry
     * @example
     * // Get one TimesheetEntry
     * const timesheetEntry = await prisma.timesheetEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TimesheetEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, TimesheetEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TimesheetEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TimesheetEntries
     * const timesheetEntries = await prisma.timesheetEntry.findMany()
     * 
     * // Get first 10 TimesheetEntries
     * const timesheetEntries = await prisma.timesheetEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const timesheetEntryWithIdOnly = await prisma.timesheetEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TimesheetEntryFindManyArgs>(args?: SelectSubset<T, TimesheetEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TimesheetEntry.
     * @param {TimesheetEntryCreateArgs} args - Arguments to create a TimesheetEntry.
     * @example
     * // Create one TimesheetEntry
     * const TimesheetEntry = await prisma.timesheetEntry.create({
     *   data: {
     *     // ... data to create a TimesheetEntry
     *   }
     * })
     * 
     */
    create<T extends TimesheetEntryCreateArgs>(args: SelectSubset<T, TimesheetEntryCreateArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TimesheetEntries.
     * @param {TimesheetEntryCreateManyArgs} args - Arguments to create many TimesheetEntries.
     * @example
     * // Create many TimesheetEntries
     * const timesheetEntry = await prisma.timesheetEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TimesheetEntryCreateManyArgs>(args?: SelectSubset<T, TimesheetEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TimesheetEntries and returns the data saved in the database.
     * @param {TimesheetEntryCreateManyAndReturnArgs} args - Arguments to create many TimesheetEntries.
     * @example
     * // Create many TimesheetEntries
     * const timesheetEntry = await prisma.timesheetEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TimesheetEntries and only return the `id`
     * const timesheetEntryWithIdOnly = await prisma.timesheetEntry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TimesheetEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, TimesheetEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TimesheetEntry.
     * @param {TimesheetEntryDeleteArgs} args - Arguments to delete one TimesheetEntry.
     * @example
     * // Delete one TimesheetEntry
     * const TimesheetEntry = await prisma.timesheetEntry.delete({
     *   where: {
     *     // ... filter to delete one TimesheetEntry
     *   }
     * })
     * 
     */
    delete<T extends TimesheetEntryDeleteArgs>(args: SelectSubset<T, TimesheetEntryDeleteArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TimesheetEntry.
     * @param {TimesheetEntryUpdateArgs} args - Arguments to update one TimesheetEntry.
     * @example
     * // Update one TimesheetEntry
     * const timesheetEntry = await prisma.timesheetEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TimesheetEntryUpdateArgs>(args: SelectSubset<T, TimesheetEntryUpdateArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TimesheetEntries.
     * @param {TimesheetEntryDeleteManyArgs} args - Arguments to filter TimesheetEntries to delete.
     * @example
     * // Delete a few TimesheetEntries
     * const { count } = await prisma.timesheetEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TimesheetEntryDeleteManyArgs>(args?: SelectSubset<T, TimesheetEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TimesheetEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TimesheetEntries
     * const timesheetEntry = await prisma.timesheetEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TimesheetEntryUpdateManyArgs>(args: SelectSubset<T, TimesheetEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TimesheetEntries and returns the data updated in the database.
     * @param {TimesheetEntryUpdateManyAndReturnArgs} args - Arguments to update many TimesheetEntries.
     * @example
     * // Update many TimesheetEntries
     * const timesheetEntry = await prisma.timesheetEntry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TimesheetEntries and only return the `id`
     * const timesheetEntryWithIdOnly = await prisma.timesheetEntry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TimesheetEntryUpdateManyAndReturnArgs>(args: SelectSubset<T, TimesheetEntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TimesheetEntry.
     * @param {TimesheetEntryUpsertArgs} args - Arguments to update or create a TimesheetEntry.
     * @example
     * // Update or create a TimesheetEntry
     * const timesheetEntry = await prisma.timesheetEntry.upsert({
     *   create: {
     *     // ... data to create a TimesheetEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TimesheetEntry we want to update
     *   }
     * })
     */
    upsert<T extends TimesheetEntryUpsertArgs>(args: SelectSubset<T, TimesheetEntryUpsertArgs<ExtArgs>>): Prisma__TimesheetEntryClient<$Result.GetResult<Prisma.$TimesheetEntryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TimesheetEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryCountArgs} args - Arguments to filter TimesheetEntries to count.
     * @example
     * // Count the number of TimesheetEntries
     * const count = await prisma.timesheetEntry.count({
     *   where: {
     *     // ... the filter for the TimesheetEntries we want to count
     *   }
     * })
    **/
    count<T extends TimesheetEntryCountArgs>(
      args?: Subset<T, TimesheetEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TimesheetEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TimesheetEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TimesheetEntryAggregateArgs>(args: Subset<T, TimesheetEntryAggregateArgs>): Prisma.PrismaPromise<GetTimesheetEntryAggregateType<T>>

    /**
     * Group by TimesheetEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimesheetEntryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TimesheetEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TimesheetEntryGroupByArgs['orderBy'] }
        : { orderBy?: TimesheetEntryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TimesheetEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTimesheetEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TimesheetEntry model
   */
  readonly fields: TimesheetEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TimesheetEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TimesheetEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    feature<T extends FeatureDefaultArgs<ExtArgs> = {}>(args?: Subset<T, FeatureDefaultArgs<ExtArgs>>): Prisma__FeatureClient<$Result.GetResult<Prisma.$FeaturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    project<T extends ProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProjectDefaultArgs<ExtArgs>>): Prisma__ProjectClient<$Result.GetResult<Prisma.$ProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TimesheetEntry model
   */
  interface TimesheetEntryFieldRefs {
    readonly id: FieldRef<"TimesheetEntry", 'Int'>
    readonly projectId: FieldRef<"TimesheetEntry", 'Int'>
    readonly featureId: FieldRef<"TimesheetEntry", 'Int'>
    readonly date: FieldRef<"TimesheetEntry", 'DateTime'>
    readonly hours: FieldRef<"TimesheetEntry", 'Decimal'>
    readonly description: FieldRef<"TimesheetEntry", 'String'>
    readonly status: FieldRef<"TimesheetEntry", 'String'>
    readonly is_deleted: FieldRef<"TimesheetEntry", 'Boolean'>
    readonly createdAt: FieldRef<"TimesheetEntry", 'DateTime'>
    readonly createdBy: FieldRef<"TimesheetEntry", 'Int'>
    readonly updatedAt: FieldRef<"TimesheetEntry", 'DateTime'>
    readonly updatedBy: FieldRef<"TimesheetEntry", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * TimesheetEntry findUnique
   */
  export type TimesheetEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * Filter, which TimesheetEntry to fetch.
     */
    where: TimesheetEntryWhereUniqueInput
  }

  /**
   * TimesheetEntry findUniqueOrThrow
   */
  export type TimesheetEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * Filter, which TimesheetEntry to fetch.
     */
    where: TimesheetEntryWhereUniqueInput
  }

  /**
   * TimesheetEntry findFirst
   */
  export type TimesheetEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * Filter, which TimesheetEntry to fetch.
     */
    where?: TimesheetEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimesheetEntries to fetch.
     */
    orderBy?: TimesheetEntryOrderByWithRelationInput | TimesheetEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TimesheetEntries.
     */
    cursor?: TimesheetEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimesheetEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimesheetEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TimesheetEntries.
     */
    distinct?: TimesheetEntryScalarFieldEnum | TimesheetEntryScalarFieldEnum[]
  }

  /**
   * TimesheetEntry findFirstOrThrow
   */
  export type TimesheetEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * Filter, which TimesheetEntry to fetch.
     */
    where?: TimesheetEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimesheetEntries to fetch.
     */
    orderBy?: TimesheetEntryOrderByWithRelationInput | TimesheetEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TimesheetEntries.
     */
    cursor?: TimesheetEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimesheetEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimesheetEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TimesheetEntries.
     */
    distinct?: TimesheetEntryScalarFieldEnum | TimesheetEntryScalarFieldEnum[]
  }

  /**
   * TimesheetEntry findMany
   */
  export type TimesheetEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * Filter, which TimesheetEntries to fetch.
     */
    where?: TimesheetEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimesheetEntries to fetch.
     */
    orderBy?: TimesheetEntryOrderByWithRelationInput | TimesheetEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TimesheetEntries.
     */
    cursor?: TimesheetEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimesheetEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimesheetEntries.
     */
    skip?: number
    distinct?: TimesheetEntryScalarFieldEnum | TimesheetEntryScalarFieldEnum[]
  }

  /**
   * TimesheetEntry create
   */
  export type TimesheetEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * The data needed to create a TimesheetEntry.
     */
    data: XOR<TimesheetEntryCreateInput, TimesheetEntryUncheckedCreateInput>
  }

  /**
   * TimesheetEntry createMany
   */
  export type TimesheetEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TimesheetEntries.
     */
    data: TimesheetEntryCreateManyInput | TimesheetEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TimesheetEntry createManyAndReturn
   */
  export type TimesheetEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * The data used to create many TimesheetEntries.
     */
    data: TimesheetEntryCreateManyInput | TimesheetEntryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TimesheetEntry update
   */
  export type TimesheetEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * The data needed to update a TimesheetEntry.
     */
    data: XOR<TimesheetEntryUpdateInput, TimesheetEntryUncheckedUpdateInput>
    /**
     * Choose, which TimesheetEntry to update.
     */
    where: TimesheetEntryWhereUniqueInput
  }

  /**
   * TimesheetEntry updateMany
   */
  export type TimesheetEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TimesheetEntries.
     */
    data: XOR<TimesheetEntryUpdateManyMutationInput, TimesheetEntryUncheckedUpdateManyInput>
    /**
     * Filter which TimesheetEntries to update
     */
    where?: TimesheetEntryWhereInput
    /**
     * Limit how many TimesheetEntries to update.
     */
    limit?: number
  }

  /**
   * TimesheetEntry updateManyAndReturn
   */
  export type TimesheetEntryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * The data used to update TimesheetEntries.
     */
    data: XOR<TimesheetEntryUpdateManyMutationInput, TimesheetEntryUncheckedUpdateManyInput>
    /**
     * Filter which TimesheetEntries to update
     */
    where?: TimesheetEntryWhereInput
    /**
     * Limit how many TimesheetEntries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TimesheetEntry upsert
   */
  export type TimesheetEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * The filter to search for the TimesheetEntry to update in case it exists.
     */
    where: TimesheetEntryWhereUniqueInput
    /**
     * In case the TimesheetEntry found by the `where` argument doesn't exist, create a new TimesheetEntry with this data.
     */
    create: XOR<TimesheetEntryCreateInput, TimesheetEntryUncheckedCreateInput>
    /**
     * In case the TimesheetEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TimesheetEntryUpdateInput, TimesheetEntryUncheckedUpdateInput>
  }

  /**
   * TimesheetEntry delete
   */
  export type TimesheetEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
    /**
     * Filter which TimesheetEntry to delete.
     */
    where: TimesheetEntryWhereUniqueInput
  }

  /**
   * TimesheetEntry deleteMany
   */
  export type TimesheetEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TimesheetEntries to delete
     */
    where?: TimesheetEntryWhereInput
    /**
     * Limit how many TimesheetEntries to delete.
     */
    limit?: number
  }

  /**
   * TimesheetEntry without action
   */
  export type TimesheetEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimesheetEntry
     */
    select?: TimesheetEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TimesheetEntry
     */
    omit?: TimesheetEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimesheetEntryInclude<ExtArgs> | null
  }


  /**
   * Model Overtime
   */

  export type AggregateOvertime = {
    _count: OvertimeCountAggregateOutputType | null
    _avg: OvertimeAvgAggregateOutputType | null
    _sum: OvertimeSumAggregateOutputType | null
    _min: OvertimeMinAggregateOutputType | null
    _max: OvertimeMaxAggregateOutputType | null
  }

  export type OvertimeAvgAggregateOutputType = {
    id: number | null
  }

  export type OvertimeSumAggregateOutputType = {
    id: number | null
  }

  export type OvertimeMinAggregateOutputType = {
    id: number | null
    requesterId: string | null
    requestDate: Date | null
    status: string | null
    isDeleted: boolean | null
    createdAt: Date | null
    createdBy: string | null
    updatedAt: Date | null
    updatedBy: string | null
  }

  export type OvertimeMaxAggregateOutputType = {
    id: number | null
    requesterId: string | null
    requestDate: Date | null
    status: string | null
    isDeleted: boolean | null
    createdAt: Date | null
    createdBy: string | null
    updatedAt: Date | null
    updatedBy: string | null
  }

  export type OvertimeCountAggregateOutputType = {
    id: number
    requesterId: number
    requestDate: number
    status: number
    isDeleted: number
    createdAt: number
    createdBy: number
    updatedAt: number
    updatedBy: number
    _all: number
  }


  export type OvertimeAvgAggregateInputType = {
    id?: true
  }

  export type OvertimeSumAggregateInputType = {
    id?: true
  }

  export type OvertimeMinAggregateInputType = {
    id?: true
    requesterId?: true
    requestDate?: true
    status?: true
    isDeleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type OvertimeMaxAggregateInputType = {
    id?: true
    requesterId?: true
    requestDate?: true
    status?: true
    isDeleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
  }

  export type OvertimeCountAggregateInputType = {
    id?: true
    requesterId?: true
    requestDate?: true
    status?: true
    isDeleted?: true
    createdAt?: true
    createdBy?: true
    updatedAt?: true
    updatedBy?: true
    _all?: true
  }

  export type OvertimeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Overtime to aggregate.
     */
    where?: OvertimeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Overtimes to fetch.
     */
    orderBy?: OvertimeOrderByWithRelationInput | OvertimeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OvertimeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Overtimes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Overtimes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Overtimes
    **/
    _count?: true | OvertimeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OvertimeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OvertimeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OvertimeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OvertimeMaxAggregateInputType
  }

  export type GetOvertimeAggregateType<T extends OvertimeAggregateArgs> = {
        [P in keyof T & keyof AggregateOvertime]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOvertime[P]>
      : GetScalarType<T[P], AggregateOvertime[P]>
  }




  export type OvertimeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OvertimeWhereInput
    orderBy?: OvertimeOrderByWithAggregationInput | OvertimeOrderByWithAggregationInput[]
    by: OvertimeScalarFieldEnum[] | OvertimeScalarFieldEnum
    having?: OvertimeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OvertimeCountAggregateInputType | true
    _avg?: OvertimeAvgAggregateInputType
    _sum?: OvertimeSumAggregateInputType
    _min?: OvertimeMinAggregateInputType
    _max?: OvertimeMaxAggregateInputType
  }

  export type OvertimeGroupByOutputType = {
    id: number
    requesterId: string
    requestDate: Date
    status: string
    isDeleted: boolean
    createdAt: Date
    createdBy: string
    updatedAt: Date
    updatedBy: string | null
    _count: OvertimeCountAggregateOutputType | null
    _avg: OvertimeAvgAggregateOutputType | null
    _sum: OvertimeSumAggregateOutputType | null
    _min: OvertimeMinAggregateOutputType | null
    _max: OvertimeMaxAggregateOutputType | null
  }

  type GetOvertimeGroupByPayload<T extends OvertimeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OvertimeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OvertimeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OvertimeGroupByOutputType[P]>
            : GetScalarType<T[P], OvertimeGroupByOutputType[P]>
        }
      >
    >


  export type OvertimeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requesterId?: boolean
    requestDate?: boolean
    status?: boolean
    isDeleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
    descriptions?: boolean | Overtime$descriptionsArgs<ExtArgs>
    _count?: boolean | OvertimeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["overtime"]>

  export type OvertimeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requesterId?: boolean
    requestDate?: boolean
    status?: boolean
    isDeleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
  }, ExtArgs["result"]["overtime"]>

  export type OvertimeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requesterId?: boolean
    requestDate?: boolean
    status?: boolean
    isDeleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
  }, ExtArgs["result"]["overtime"]>

  export type OvertimeSelectScalar = {
    id?: boolean
    requesterId?: boolean
    requestDate?: boolean
    status?: boolean
    isDeleted?: boolean
    createdAt?: boolean
    createdBy?: boolean
    updatedAt?: boolean
    updatedBy?: boolean
  }

  export type OvertimeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "requesterId" | "requestDate" | "status" | "isDeleted" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy", ExtArgs["result"]["overtime"]>
  export type OvertimeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    descriptions?: boolean | Overtime$descriptionsArgs<ExtArgs>
    _count?: boolean | OvertimeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type OvertimeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type OvertimeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $OvertimePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Overtime"
    objects: {
      descriptions: Prisma.$OvertimeDescriptionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      requesterId: string
      requestDate: Date
      status: string
      isDeleted: boolean
      createdAt: Date
      createdBy: string
      updatedAt: Date
      updatedBy: string | null
    }, ExtArgs["result"]["overtime"]>
    composites: {}
  }

  type OvertimeGetPayload<S extends boolean | null | undefined | OvertimeDefaultArgs> = $Result.GetResult<Prisma.$OvertimePayload, S>

  type OvertimeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OvertimeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OvertimeCountAggregateInputType | true
    }

  export interface OvertimeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Overtime'], meta: { name: 'Overtime' } }
    /**
     * Find zero or one Overtime that matches the filter.
     * @param {OvertimeFindUniqueArgs} args - Arguments to find a Overtime
     * @example
     * // Get one Overtime
     * const overtime = await prisma.overtime.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OvertimeFindUniqueArgs>(args: SelectSubset<T, OvertimeFindUniqueArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Overtime that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OvertimeFindUniqueOrThrowArgs} args - Arguments to find a Overtime
     * @example
     * // Get one Overtime
     * const overtime = await prisma.overtime.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OvertimeFindUniqueOrThrowArgs>(args: SelectSubset<T, OvertimeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Overtime that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeFindFirstArgs} args - Arguments to find a Overtime
     * @example
     * // Get one Overtime
     * const overtime = await prisma.overtime.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OvertimeFindFirstArgs>(args?: SelectSubset<T, OvertimeFindFirstArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Overtime that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeFindFirstOrThrowArgs} args - Arguments to find a Overtime
     * @example
     * // Get one Overtime
     * const overtime = await prisma.overtime.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OvertimeFindFirstOrThrowArgs>(args?: SelectSubset<T, OvertimeFindFirstOrThrowArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Overtimes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Overtimes
     * const overtimes = await prisma.overtime.findMany()
     * 
     * // Get first 10 Overtimes
     * const overtimes = await prisma.overtime.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const overtimeWithIdOnly = await prisma.overtime.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OvertimeFindManyArgs>(args?: SelectSubset<T, OvertimeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Overtime.
     * @param {OvertimeCreateArgs} args - Arguments to create a Overtime.
     * @example
     * // Create one Overtime
     * const Overtime = await prisma.overtime.create({
     *   data: {
     *     // ... data to create a Overtime
     *   }
     * })
     * 
     */
    create<T extends OvertimeCreateArgs>(args: SelectSubset<T, OvertimeCreateArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Overtimes.
     * @param {OvertimeCreateManyArgs} args - Arguments to create many Overtimes.
     * @example
     * // Create many Overtimes
     * const overtime = await prisma.overtime.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OvertimeCreateManyArgs>(args?: SelectSubset<T, OvertimeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Overtimes and returns the data saved in the database.
     * @param {OvertimeCreateManyAndReturnArgs} args - Arguments to create many Overtimes.
     * @example
     * // Create many Overtimes
     * const overtime = await prisma.overtime.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Overtimes and only return the `id`
     * const overtimeWithIdOnly = await prisma.overtime.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OvertimeCreateManyAndReturnArgs>(args?: SelectSubset<T, OvertimeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Overtime.
     * @param {OvertimeDeleteArgs} args - Arguments to delete one Overtime.
     * @example
     * // Delete one Overtime
     * const Overtime = await prisma.overtime.delete({
     *   where: {
     *     // ... filter to delete one Overtime
     *   }
     * })
     * 
     */
    delete<T extends OvertimeDeleteArgs>(args: SelectSubset<T, OvertimeDeleteArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Overtime.
     * @param {OvertimeUpdateArgs} args - Arguments to update one Overtime.
     * @example
     * // Update one Overtime
     * const overtime = await prisma.overtime.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OvertimeUpdateArgs>(args: SelectSubset<T, OvertimeUpdateArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Overtimes.
     * @param {OvertimeDeleteManyArgs} args - Arguments to filter Overtimes to delete.
     * @example
     * // Delete a few Overtimes
     * const { count } = await prisma.overtime.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OvertimeDeleteManyArgs>(args?: SelectSubset<T, OvertimeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Overtimes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Overtimes
     * const overtime = await prisma.overtime.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OvertimeUpdateManyArgs>(args: SelectSubset<T, OvertimeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Overtimes and returns the data updated in the database.
     * @param {OvertimeUpdateManyAndReturnArgs} args - Arguments to update many Overtimes.
     * @example
     * // Update many Overtimes
     * const overtime = await prisma.overtime.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Overtimes and only return the `id`
     * const overtimeWithIdOnly = await prisma.overtime.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OvertimeUpdateManyAndReturnArgs>(args: SelectSubset<T, OvertimeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Overtime.
     * @param {OvertimeUpsertArgs} args - Arguments to update or create a Overtime.
     * @example
     * // Update or create a Overtime
     * const overtime = await prisma.overtime.upsert({
     *   create: {
     *     // ... data to create a Overtime
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Overtime we want to update
     *   }
     * })
     */
    upsert<T extends OvertimeUpsertArgs>(args: SelectSubset<T, OvertimeUpsertArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Overtimes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeCountArgs} args - Arguments to filter Overtimes to count.
     * @example
     * // Count the number of Overtimes
     * const count = await prisma.overtime.count({
     *   where: {
     *     // ... the filter for the Overtimes we want to count
     *   }
     * })
    **/
    count<T extends OvertimeCountArgs>(
      args?: Subset<T, OvertimeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OvertimeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Overtime.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OvertimeAggregateArgs>(args: Subset<T, OvertimeAggregateArgs>): Prisma.PrismaPromise<GetOvertimeAggregateType<T>>

    /**
     * Group by Overtime.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OvertimeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OvertimeGroupByArgs['orderBy'] }
        : { orderBy?: OvertimeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OvertimeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOvertimeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Overtime model
   */
  readonly fields: OvertimeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Overtime.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OvertimeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    descriptions<T extends Overtime$descriptionsArgs<ExtArgs> = {}>(args?: Subset<T, Overtime$descriptionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Overtime model
   */
  interface OvertimeFieldRefs {
    readonly id: FieldRef<"Overtime", 'Int'>
    readonly requesterId: FieldRef<"Overtime", 'String'>
    readonly requestDate: FieldRef<"Overtime", 'DateTime'>
    readonly status: FieldRef<"Overtime", 'String'>
    readonly isDeleted: FieldRef<"Overtime", 'Boolean'>
    readonly createdAt: FieldRef<"Overtime", 'DateTime'>
    readonly createdBy: FieldRef<"Overtime", 'String'>
    readonly updatedAt: FieldRef<"Overtime", 'DateTime'>
    readonly updatedBy: FieldRef<"Overtime", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Overtime findUnique
   */
  export type OvertimeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * Filter, which Overtime to fetch.
     */
    where: OvertimeWhereUniqueInput
  }

  /**
   * Overtime findUniqueOrThrow
   */
  export type OvertimeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * Filter, which Overtime to fetch.
     */
    where: OvertimeWhereUniqueInput
  }

  /**
   * Overtime findFirst
   */
  export type OvertimeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * Filter, which Overtime to fetch.
     */
    where?: OvertimeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Overtimes to fetch.
     */
    orderBy?: OvertimeOrderByWithRelationInput | OvertimeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Overtimes.
     */
    cursor?: OvertimeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Overtimes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Overtimes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Overtimes.
     */
    distinct?: OvertimeScalarFieldEnum | OvertimeScalarFieldEnum[]
  }

  /**
   * Overtime findFirstOrThrow
   */
  export type OvertimeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * Filter, which Overtime to fetch.
     */
    where?: OvertimeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Overtimes to fetch.
     */
    orderBy?: OvertimeOrderByWithRelationInput | OvertimeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Overtimes.
     */
    cursor?: OvertimeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Overtimes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Overtimes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Overtimes.
     */
    distinct?: OvertimeScalarFieldEnum | OvertimeScalarFieldEnum[]
  }

  /**
   * Overtime findMany
   */
  export type OvertimeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * Filter, which Overtimes to fetch.
     */
    where?: OvertimeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Overtimes to fetch.
     */
    orderBy?: OvertimeOrderByWithRelationInput | OvertimeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Overtimes.
     */
    cursor?: OvertimeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Overtimes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Overtimes.
     */
    skip?: number
    distinct?: OvertimeScalarFieldEnum | OvertimeScalarFieldEnum[]
  }

  /**
   * Overtime create
   */
  export type OvertimeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * The data needed to create a Overtime.
     */
    data: XOR<OvertimeCreateInput, OvertimeUncheckedCreateInput>
  }

  /**
   * Overtime createMany
   */
  export type OvertimeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Overtimes.
     */
    data: OvertimeCreateManyInput | OvertimeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Overtime createManyAndReturn
   */
  export type OvertimeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * The data used to create many Overtimes.
     */
    data: OvertimeCreateManyInput | OvertimeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Overtime update
   */
  export type OvertimeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * The data needed to update a Overtime.
     */
    data: XOR<OvertimeUpdateInput, OvertimeUncheckedUpdateInput>
    /**
     * Choose, which Overtime to update.
     */
    where: OvertimeWhereUniqueInput
  }

  /**
   * Overtime updateMany
   */
  export type OvertimeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Overtimes.
     */
    data: XOR<OvertimeUpdateManyMutationInput, OvertimeUncheckedUpdateManyInput>
    /**
     * Filter which Overtimes to update
     */
    where?: OvertimeWhereInput
    /**
     * Limit how many Overtimes to update.
     */
    limit?: number
  }

  /**
   * Overtime updateManyAndReturn
   */
  export type OvertimeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * The data used to update Overtimes.
     */
    data: XOR<OvertimeUpdateManyMutationInput, OvertimeUncheckedUpdateManyInput>
    /**
     * Filter which Overtimes to update
     */
    where?: OvertimeWhereInput
    /**
     * Limit how many Overtimes to update.
     */
    limit?: number
  }

  /**
   * Overtime upsert
   */
  export type OvertimeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * The filter to search for the Overtime to update in case it exists.
     */
    where: OvertimeWhereUniqueInput
    /**
     * In case the Overtime found by the `where` argument doesn't exist, create a new Overtime with this data.
     */
    create: XOR<OvertimeCreateInput, OvertimeUncheckedCreateInput>
    /**
     * In case the Overtime was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OvertimeUpdateInput, OvertimeUncheckedUpdateInput>
  }

  /**
   * Overtime delete
   */
  export type OvertimeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
    /**
     * Filter which Overtime to delete.
     */
    where: OvertimeWhereUniqueInput
  }

  /**
   * Overtime deleteMany
   */
  export type OvertimeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Overtimes to delete
     */
    where?: OvertimeWhereInput
    /**
     * Limit how many Overtimes to delete.
     */
    limit?: number
  }

  /**
   * Overtime.descriptions
   */
  export type Overtime$descriptionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    where?: OvertimeDescriptionWhereInput
    orderBy?: OvertimeDescriptionOrderByWithRelationInput | OvertimeDescriptionOrderByWithRelationInput[]
    cursor?: OvertimeDescriptionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OvertimeDescriptionScalarFieldEnum | OvertimeDescriptionScalarFieldEnum[]
  }

  /**
   * Overtime without action
   */
  export type OvertimeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Overtime
     */
    select?: OvertimeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Overtime
     */
    omit?: OvertimeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeInclude<ExtArgs> | null
  }


  /**
   * Model OvertimeDescription
   */

  export type AggregateOvertimeDescription = {
    _count: OvertimeDescriptionCountAggregateOutputType | null
    _avg: OvertimeDescriptionAvgAggregateOutputType | null
    _sum: OvertimeDescriptionSumAggregateOutputType | null
    _min: OvertimeDescriptionMinAggregateOutputType | null
    _max: OvertimeDescriptionMaxAggregateOutputType | null
  }

  export type OvertimeDescriptionAvgAggregateOutputType = {
    id: number | null
    overtimeId: number | null
    duration: Decimal | null
  }

  export type OvertimeDescriptionSumAggregateOutputType = {
    id: number | null
    overtimeId: number | null
    duration: Decimal | null
  }

  export type OvertimeDescriptionMinAggregateOutputType = {
    id: number | null
    overtimeId: number | null
    assignee: string | null
    description: string | null
    duration: Decimal | null
    date: Date | null
    startDate: Date | null
    endDate: Date | null
  }

  export type OvertimeDescriptionMaxAggregateOutputType = {
    id: number | null
    overtimeId: number | null
    assignee: string | null
    description: string | null
    duration: Decimal | null
    date: Date | null
    startDate: Date | null
    endDate: Date | null
  }

  export type OvertimeDescriptionCountAggregateOutputType = {
    id: number
    overtimeId: number
    assignee: number
    description: number
    duration: number
    date: number
    startDate: number
    endDate: number
    _all: number
  }


  export type OvertimeDescriptionAvgAggregateInputType = {
    id?: true
    overtimeId?: true
    duration?: true
  }

  export type OvertimeDescriptionSumAggregateInputType = {
    id?: true
    overtimeId?: true
    duration?: true
  }

  export type OvertimeDescriptionMinAggregateInputType = {
    id?: true
    overtimeId?: true
    assignee?: true
    description?: true
    duration?: true
    date?: true
    startDate?: true
    endDate?: true
  }

  export type OvertimeDescriptionMaxAggregateInputType = {
    id?: true
    overtimeId?: true
    assignee?: true
    description?: true
    duration?: true
    date?: true
    startDate?: true
    endDate?: true
  }

  export type OvertimeDescriptionCountAggregateInputType = {
    id?: true
    overtimeId?: true
    assignee?: true
    description?: true
    duration?: true
    date?: true
    startDate?: true
    endDate?: true
    _all?: true
  }

  export type OvertimeDescriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OvertimeDescription to aggregate.
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OvertimeDescriptions to fetch.
     */
    orderBy?: OvertimeDescriptionOrderByWithRelationInput | OvertimeDescriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OvertimeDescriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OvertimeDescriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OvertimeDescriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OvertimeDescriptions
    **/
    _count?: true | OvertimeDescriptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OvertimeDescriptionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OvertimeDescriptionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OvertimeDescriptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OvertimeDescriptionMaxAggregateInputType
  }

  export type GetOvertimeDescriptionAggregateType<T extends OvertimeDescriptionAggregateArgs> = {
        [P in keyof T & keyof AggregateOvertimeDescription]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOvertimeDescription[P]>
      : GetScalarType<T[P], AggregateOvertimeDescription[P]>
  }




  export type OvertimeDescriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OvertimeDescriptionWhereInput
    orderBy?: OvertimeDescriptionOrderByWithAggregationInput | OvertimeDescriptionOrderByWithAggregationInput[]
    by: OvertimeDescriptionScalarFieldEnum[] | OvertimeDescriptionScalarFieldEnum
    having?: OvertimeDescriptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OvertimeDescriptionCountAggregateInputType | true
    _avg?: OvertimeDescriptionAvgAggregateInputType
    _sum?: OvertimeDescriptionSumAggregateInputType
    _min?: OvertimeDescriptionMinAggregateInputType
    _max?: OvertimeDescriptionMaxAggregateInputType
  }

  export type OvertimeDescriptionGroupByOutputType = {
    id: number
    overtimeId: number
    assignee: string
    description: string
    duration: Decimal
    date: Date | null
    startDate: Date | null
    endDate: Date | null
    _count: OvertimeDescriptionCountAggregateOutputType | null
    _avg: OvertimeDescriptionAvgAggregateOutputType | null
    _sum: OvertimeDescriptionSumAggregateOutputType | null
    _min: OvertimeDescriptionMinAggregateOutputType | null
    _max: OvertimeDescriptionMaxAggregateOutputType | null
  }

  type GetOvertimeDescriptionGroupByPayload<T extends OvertimeDescriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OvertimeDescriptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OvertimeDescriptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OvertimeDescriptionGroupByOutputType[P]>
            : GetScalarType<T[P], OvertimeDescriptionGroupByOutputType[P]>
        }
      >
    >


  export type OvertimeDescriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    overtimeId?: boolean
    assignee?: boolean
    description?: boolean
    duration?: boolean
    date?: boolean
    startDate?: boolean
    endDate?: boolean
    overtime?: boolean | OvertimeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["overtimeDescription"]>

  export type OvertimeDescriptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    overtimeId?: boolean
    assignee?: boolean
    description?: boolean
    duration?: boolean
    date?: boolean
    startDate?: boolean
    endDate?: boolean
    overtime?: boolean | OvertimeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["overtimeDescription"]>

  export type OvertimeDescriptionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    overtimeId?: boolean
    assignee?: boolean
    description?: boolean
    duration?: boolean
    date?: boolean
    startDate?: boolean
    endDate?: boolean
    overtime?: boolean | OvertimeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["overtimeDescription"]>

  export type OvertimeDescriptionSelectScalar = {
    id?: boolean
    overtimeId?: boolean
    assignee?: boolean
    description?: boolean
    duration?: boolean
    date?: boolean
    startDate?: boolean
    endDate?: boolean
  }

  export type OvertimeDescriptionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "overtimeId" | "assignee" | "description" | "duration" | "date" | "startDate" | "endDate", ExtArgs["result"]["overtimeDescription"]>
  export type OvertimeDescriptionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    overtime?: boolean | OvertimeDefaultArgs<ExtArgs>
  }
  export type OvertimeDescriptionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    overtime?: boolean | OvertimeDefaultArgs<ExtArgs>
  }
  export type OvertimeDescriptionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    overtime?: boolean | OvertimeDefaultArgs<ExtArgs>
  }

  export type $OvertimeDescriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OvertimeDescription"
    objects: {
      overtime: Prisma.$OvertimePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      overtimeId: number
      assignee: string
      description: string
      duration: Prisma.Decimal
      date: Date | null
      startDate: Date | null
      endDate: Date | null
    }, ExtArgs["result"]["overtimeDescription"]>
    composites: {}
  }

  type OvertimeDescriptionGetPayload<S extends boolean | null | undefined | OvertimeDescriptionDefaultArgs> = $Result.GetResult<Prisma.$OvertimeDescriptionPayload, S>

  type OvertimeDescriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OvertimeDescriptionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OvertimeDescriptionCountAggregateInputType | true
    }

  export interface OvertimeDescriptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OvertimeDescription'], meta: { name: 'OvertimeDescription' } }
    /**
     * Find zero or one OvertimeDescription that matches the filter.
     * @param {OvertimeDescriptionFindUniqueArgs} args - Arguments to find a OvertimeDescription
     * @example
     * // Get one OvertimeDescription
     * const overtimeDescription = await prisma.overtimeDescription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OvertimeDescriptionFindUniqueArgs>(args: SelectSubset<T, OvertimeDescriptionFindUniqueArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OvertimeDescription that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OvertimeDescriptionFindUniqueOrThrowArgs} args - Arguments to find a OvertimeDescription
     * @example
     * // Get one OvertimeDescription
     * const overtimeDescription = await prisma.overtimeDescription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OvertimeDescriptionFindUniqueOrThrowArgs>(args: SelectSubset<T, OvertimeDescriptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OvertimeDescription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionFindFirstArgs} args - Arguments to find a OvertimeDescription
     * @example
     * // Get one OvertimeDescription
     * const overtimeDescription = await prisma.overtimeDescription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OvertimeDescriptionFindFirstArgs>(args?: SelectSubset<T, OvertimeDescriptionFindFirstArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OvertimeDescription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionFindFirstOrThrowArgs} args - Arguments to find a OvertimeDescription
     * @example
     * // Get one OvertimeDescription
     * const overtimeDescription = await prisma.overtimeDescription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OvertimeDescriptionFindFirstOrThrowArgs>(args?: SelectSubset<T, OvertimeDescriptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OvertimeDescriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OvertimeDescriptions
     * const overtimeDescriptions = await prisma.overtimeDescription.findMany()
     * 
     * // Get first 10 OvertimeDescriptions
     * const overtimeDescriptions = await prisma.overtimeDescription.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const overtimeDescriptionWithIdOnly = await prisma.overtimeDescription.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OvertimeDescriptionFindManyArgs>(args?: SelectSubset<T, OvertimeDescriptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OvertimeDescription.
     * @param {OvertimeDescriptionCreateArgs} args - Arguments to create a OvertimeDescription.
     * @example
     * // Create one OvertimeDescription
     * const OvertimeDescription = await prisma.overtimeDescription.create({
     *   data: {
     *     // ... data to create a OvertimeDescription
     *   }
     * })
     * 
     */
    create<T extends OvertimeDescriptionCreateArgs>(args: SelectSubset<T, OvertimeDescriptionCreateArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OvertimeDescriptions.
     * @param {OvertimeDescriptionCreateManyArgs} args - Arguments to create many OvertimeDescriptions.
     * @example
     * // Create many OvertimeDescriptions
     * const overtimeDescription = await prisma.overtimeDescription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OvertimeDescriptionCreateManyArgs>(args?: SelectSubset<T, OvertimeDescriptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OvertimeDescriptions and returns the data saved in the database.
     * @param {OvertimeDescriptionCreateManyAndReturnArgs} args - Arguments to create many OvertimeDescriptions.
     * @example
     * // Create many OvertimeDescriptions
     * const overtimeDescription = await prisma.overtimeDescription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OvertimeDescriptions and only return the `id`
     * const overtimeDescriptionWithIdOnly = await prisma.overtimeDescription.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OvertimeDescriptionCreateManyAndReturnArgs>(args?: SelectSubset<T, OvertimeDescriptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a OvertimeDescription.
     * @param {OvertimeDescriptionDeleteArgs} args - Arguments to delete one OvertimeDescription.
     * @example
     * // Delete one OvertimeDescription
     * const OvertimeDescription = await prisma.overtimeDescription.delete({
     *   where: {
     *     // ... filter to delete one OvertimeDescription
     *   }
     * })
     * 
     */
    delete<T extends OvertimeDescriptionDeleteArgs>(args: SelectSubset<T, OvertimeDescriptionDeleteArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OvertimeDescription.
     * @param {OvertimeDescriptionUpdateArgs} args - Arguments to update one OvertimeDescription.
     * @example
     * // Update one OvertimeDescription
     * const overtimeDescription = await prisma.overtimeDescription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OvertimeDescriptionUpdateArgs>(args: SelectSubset<T, OvertimeDescriptionUpdateArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OvertimeDescriptions.
     * @param {OvertimeDescriptionDeleteManyArgs} args - Arguments to filter OvertimeDescriptions to delete.
     * @example
     * // Delete a few OvertimeDescriptions
     * const { count } = await prisma.overtimeDescription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OvertimeDescriptionDeleteManyArgs>(args?: SelectSubset<T, OvertimeDescriptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OvertimeDescriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OvertimeDescriptions
     * const overtimeDescription = await prisma.overtimeDescription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OvertimeDescriptionUpdateManyArgs>(args: SelectSubset<T, OvertimeDescriptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OvertimeDescriptions and returns the data updated in the database.
     * @param {OvertimeDescriptionUpdateManyAndReturnArgs} args - Arguments to update many OvertimeDescriptions.
     * @example
     * // Update many OvertimeDescriptions
     * const overtimeDescription = await prisma.overtimeDescription.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more OvertimeDescriptions and only return the `id`
     * const overtimeDescriptionWithIdOnly = await prisma.overtimeDescription.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OvertimeDescriptionUpdateManyAndReturnArgs>(args: SelectSubset<T, OvertimeDescriptionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one OvertimeDescription.
     * @param {OvertimeDescriptionUpsertArgs} args - Arguments to update or create a OvertimeDescription.
     * @example
     * // Update or create a OvertimeDescription
     * const overtimeDescription = await prisma.overtimeDescription.upsert({
     *   create: {
     *     // ... data to create a OvertimeDescription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OvertimeDescription we want to update
     *   }
     * })
     */
    upsert<T extends OvertimeDescriptionUpsertArgs>(args: SelectSubset<T, OvertimeDescriptionUpsertArgs<ExtArgs>>): Prisma__OvertimeDescriptionClient<$Result.GetResult<Prisma.$OvertimeDescriptionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OvertimeDescriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionCountArgs} args - Arguments to filter OvertimeDescriptions to count.
     * @example
     * // Count the number of OvertimeDescriptions
     * const count = await prisma.overtimeDescription.count({
     *   where: {
     *     // ... the filter for the OvertimeDescriptions we want to count
     *   }
     * })
    **/
    count<T extends OvertimeDescriptionCountArgs>(
      args?: Subset<T, OvertimeDescriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OvertimeDescriptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OvertimeDescription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OvertimeDescriptionAggregateArgs>(args: Subset<T, OvertimeDescriptionAggregateArgs>): Prisma.PrismaPromise<GetOvertimeDescriptionAggregateType<T>>

    /**
     * Group by OvertimeDescription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OvertimeDescriptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OvertimeDescriptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OvertimeDescriptionGroupByArgs['orderBy'] }
        : { orderBy?: OvertimeDescriptionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OvertimeDescriptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOvertimeDescriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OvertimeDescription model
   */
  readonly fields: OvertimeDescriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OvertimeDescription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OvertimeDescriptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    overtime<T extends OvertimeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OvertimeDefaultArgs<ExtArgs>>): Prisma__OvertimeClient<$Result.GetResult<Prisma.$OvertimePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OvertimeDescription model
   */
  interface OvertimeDescriptionFieldRefs {
    readonly id: FieldRef<"OvertimeDescription", 'Int'>
    readonly overtimeId: FieldRef<"OvertimeDescription", 'Int'>
    readonly assignee: FieldRef<"OvertimeDescription", 'String'>
    readonly description: FieldRef<"OvertimeDescription", 'String'>
    readonly duration: FieldRef<"OvertimeDescription", 'Decimal'>
    readonly date: FieldRef<"OvertimeDescription", 'DateTime'>
    readonly startDate: FieldRef<"OvertimeDescription", 'DateTime'>
    readonly endDate: FieldRef<"OvertimeDescription", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * OvertimeDescription findUnique
   */
  export type OvertimeDescriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * Filter, which OvertimeDescription to fetch.
     */
    where: OvertimeDescriptionWhereUniqueInput
  }

  /**
   * OvertimeDescription findUniqueOrThrow
   */
  export type OvertimeDescriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * Filter, which OvertimeDescription to fetch.
     */
    where: OvertimeDescriptionWhereUniqueInput
  }

  /**
   * OvertimeDescription findFirst
   */
  export type OvertimeDescriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * Filter, which OvertimeDescription to fetch.
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OvertimeDescriptions to fetch.
     */
    orderBy?: OvertimeDescriptionOrderByWithRelationInput | OvertimeDescriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OvertimeDescriptions.
     */
    cursor?: OvertimeDescriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OvertimeDescriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OvertimeDescriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OvertimeDescriptions.
     */
    distinct?: OvertimeDescriptionScalarFieldEnum | OvertimeDescriptionScalarFieldEnum[]
  }

  /**
   * OvertimeDescription findFirstOrThrow
   */
  export type OvertimeDescriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * Filter, which OvertimeDescription to fetch.
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OvertimeDescriptions to fetch.
     */
    orderBy?: OvertimeDescriptionOrderByWithRelationInput | OvertimeDescriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OvertimeDescriptions.
     */
    cursor?: OvertimeDescriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OvertimeDescriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OvertimeDescriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OvertimeDescriptions.
     */
    distinct?: OvertimeDescriptionScalarFieldEnum | OvertimeDescriptionScalarFieldEnum[]
  }

  /**
   * OvertimeDescription findMany
   */
  export type OvertimeDescriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * Filter, which OvertimeDescriptions to fetch.
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OvertimeDescriptions to fetch.
     */
    orderBy?: OvertimeDescriptionOrderByWithRelationInput | OvertimeDescriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OvertimeDescriptions.
     */
    cursor?: OvertimeDescriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OvertimeDescriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OvertimeDescriptions.
     */
    skip?: number
    distinct?: OvertimeDescriptionScalarFieldEnum | OvertimeDescriptionScalarFieldEnum[]
  }

  /**
   * OvertimeDescription create
   */
  export type OvertimeDescriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * The data needed to create a OvertimeDescription.
     */
    data: XOR<OvertimeDescriptionCreateInput, OvertimeDescriptionUncheckedCreateInput>
  }

  /**
   * OvertimeDescription createMany
   */
  export type OvertimeDescriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OvertimeDescriptions.
     */
    data: OvertimeDescriptionCreateManyInput | OvertimeDescriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OvertimeDescription createManyAndReturn
   */
  export type OvertimeDescriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * The data used to create many OvertimeDescriptions.
     */
    data: OvertimeDescriptionCreateManyInput | OvertimeDescriptionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * OvertimeDescription update
   */
  export type OvertimeDescriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * The data needed to update a OvertimeDescription.
     */
    data: XOR<OvertimeDescriptionUpdateInput, OvertimeDescriptionUncheckedUpdateInput>
    /**
     * Choose, which OvertimeDescription to update.
     */
    where: OvertimeDescriptionWhereUniqueInput
  }

  /**
   * OvertimeDescription updateMany
   */
  export type OvertimeDescriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OvertimeDescriptions.
     */
    data: XOR<OvertimeDescriptionUpdateManyMutationInput, OvertimeDescriptionUncheckedUpdateManyInput>
    /**
     * Filter which OvertimeDescriptions to update
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * Limit how many OvertimeDescriptions to update.
     */
    limit?: number
  }

  /**
   * OvertimeDescription updateManyAndReturn
   */
  export type OvertimeDescriptionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * The data used to update OvertimeDescriptions.
     */
    data: XOR<OvertimeDescriptionUpdateManyMutationInput, OvertimeDescriptionUncheckedUpdateManyInput>
    /**
     * Filter which OvertimeDescriptions to update
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * Limit how many OvertimeDescriptions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * OvertimeDescription upsert
   */
  export type OvertimeDescriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * The filter to search for the OvertimeDescription to update in case it exists.
     */
    where: OvertimeDescriptionWhereUniqueInput
    /**
     * In case the OvertimeDescription found by the `where` argument doesn't exist, create a new OvertimeDescription with this data.
     */
    create: XOR<OvertimeDescriptionCreateInput, OvertimeDescriptionUncheckedCreateInput>
    /**
     * In case the OvertimeDescription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OvertimeDescriptionUpdateInput, OvertimeDescriptionUncheckedUpdateInput>
  }

  /**
   * OvertimeDescription delete
   */
  export type OvertimeDescriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
    /**
     * Filter which OvertimeDescription to delete.
     */
    where: OvertimeDescriptionWhereUniqueInput
  }

  /**
   * OvertimeDescription deleteMany
   */
  export type OvertimeDescriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OvertimeDescriptions to delete
     */
    where?: OvertimeDescriptionWhereInput
    /**
     * Limit how many OvertimeDescriptions to delete.
     */
    limit?: number
  }

  /**
   * OvertimeDescription without action
   */
  export type OvertimeDescriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OvertimeDescription
     */
    select?: OvertimeDescriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OvertimeDescription
     */
    omit?: OvertimeDescriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OvertimeDescriptionInclude<ExtArgs> | null
  }


  /**
   * Model ApiLog
   */

  export type AggregateApiLog = {
    _count: ApiLogCountAggregateOutputType | null
    _avg: ApiLogAvgAggregateOutputType | null
    _sum: ApiLogSumAggregateOutputType | null
    _min: ApiLogMinAggregateOutputType | null
    _max: ApiLogMaxAggregateOutputType | null
  }

  export type ApiLogAvgAggregateOutputType = {
    id: number | null
    status_code: number | null
    duration_ms: number | null
  }

  export type ApiLogSumAggregateOutputType = {
    id: bigint | null
    status_code: number | null
    duration_ms: number | null
  }

  export type ApiLogMinAggregateOutputType = {
    id: bigint | null
    service_name: string | null
    endpoint: string | null
    url: string | null
    method: string | null
    ip_address: string | null
    user_agent: string | null
    status_code: number | null
    is_success: boolean | null
    error_message: string | null
    request_time: Date | null
    response_time: Date | null
    duration_ms: number | null
    trace_id: string | null
    called_by: string | null
    created_at: Date | null
    is_archived: boolean | null
  }

  export type ApiLogMaxAggregateOutputType = {
    id: bigint | null
    service_name: string | null
    endpoint: string | null
    url: string | null
    method: string | null
    ip_address: string | null
    user_agent: string | null
    status_code: number | null
    is_success: boolean | null
    error_message: string | null
    request_time: Date | null
    response_time: Date | null
    duration_ms: number | null
    trace_id: string | null
    called_by: string | null
    created_at: Date | null
    is_archived: boolean | null
  }

  export type ApiLogCountAggregateOutputType = {
    id: number
    service_name: number
    endpoint: number
    url: number
    method: number
    ip_address: number
    user_agent: number
    request_header: number
    request_body: number
    response_body: number
    status_code: number
    is_success: number
    error_message: number
    request_time: number
    response_time: number
    duration_ms: number
    trace_id: number
    called_by: number
    created_at: number
    is_archived: number
    _all: number
  }


  export type ApiLogAvgAggregateInputType = {
    id?: true
    status_code?: true
    duration_ms?: true
  }

  export type ApiLogSumAggregateInputType = {
    id?: true
    status_code?: true
    duration_ms?: true
  }

  export type ApiLogMinAggregateInputType = {
    id?: true
    service_name?: true
    endpoint?: true
    url?: true
    method?: true
    ip_address?: true
    user_agent?: true
    status_code?: true
    is_success?: true
    error_message?: true
    request_time?: true
    response_time?: true
    duration_ms?: true
    trace_id?: true
    called_by?: true
    created_at?: true
    is_archived?: true
  }

  export type ApiLogMaxAggregateInputType = {
    id?: true
    service_name?: true
    endpoint?: true
    url?: true
    method?: true
    ip_address?: true
    user_agent?: true
    status_code?: true
    is_success?: true
    error_message?: true
    request_time?: true
    response_time?: true
    duration_ms?: true
    trace_id?: true
    called_by?: true
    created_at?: true
    is_archived?: true
  }

  export type ApiLogCountAggregateInputType = {
    id?: true
    service_name?: true
    endpoint?: true
    url?: true
    method?: true
    ip_address?: true
    user_agent?: true
    request_header?: true
    request_body?: true
    response_body?: true
    status_code?: true
    is_success?: true
    error_message?: true
    request_time?: true
    response_time?: true
    duration_ms?: true
    trace_id?: true
    called_by?: true
    created_at?: true
    is_archived?: true
    _all?: true
  }

  export type ApiLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ApiLog to aggregate.
     */
    where?: ApiLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiLogs to fetch.
     */
    orderBy?: ApiLogOrderByWithRelationInput | ApiLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ApiLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ApiLogs
    **/
    _count?: true | ApiLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ApiLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ApiLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ApiLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ApiLogMaxAggregateInputType
  }

  export type GetApiLogAggregateType<T extends ApiLogAggregateArgs> = {
        [P in keyof T & keyof AggregateApiLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApiLog[P]>
      : GetScalarType<T[P], AggregateApiLog[P]>
  }




  export type ApiLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ApiLogWhereInput
    orderBy?: ApiLogOrderByWithAggregationInput | ApiLogOrderByWithAggregationInput[]
    by: ApiLogScalarFieldEnum[] | ApiLogScalarFieldEnum
    having?: ApiLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ApiLogCountAggregateInputType | true
    _avg?: ApiLogAvgAggregateInputType
    _sum?: ApiLogSumAggregateInputType
    _min?: ApiLogMinAggregateInputType
    _max?: ApiLogMaxAggregateInputType
  }

  export type ApiLogGroupByOutputType = {
    id: bigint
    service_name: string | null
    endpoint: string | null
    url: string | null
    method: string | null
    ip_address: string | null
    user_agent: string | null
    request_header: JsonValue | null
    request_body: JsonValue | null
    response_body: JsonValue | null
    status_code: number | null
    is_success: boolean
    error_message: string | null
    request_time: Date
    response_time: Date | null
    duration_ms: number | null
    trace_id: string | null
    called_by: string | null
    created_at: Date
    is_archived: boolean
    _count: ApiLogCountAggregateOutputType | null
    _avg: ApiLogAvgAggregateOutputType | null
    _sum: ApiLogSumAggregateOutputType | null
    _min: ApiLogMinAggregateOutputType | null
    _max: ApiLogMaxAggregateOutputType | null
  }

  type GetApiLogGroupByPayload<T extends ApiLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ApiLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ApiLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ApiLogGroupByOutputType[P]>
            : GetScalarType<T[P], ApiLogGroupByOutputType[P]>
        }
      >
    >


  export type ApiLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service_name?: boolean
    endpoint?: boolean
    url?: boolean
    method?: boolean
    ip_address?: boolean
    user_agent?: boolean
    request_header?: boolean
    request_body?: boolean
    response_body?: boolean
    status_code?: boolean
    is_success?: boolean
    error_message?: boolean
    request_time?: boolean
    response_time?: boolean
    duration_ms?: boolean
    trace_id?: boolean
    called_by?: boolean
    created_at?: boolean
    is_archived?: boolean
  }, ExtArgs["result"]["apiLog"]>

  export type ApiLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service_name?: boolean
    endpoint?: boolean
    url?: boolean
    method?: boolean
    ip_address?: boolean
    user_agent?: boolean
    request_header?: boolean
    request_body?: boolean
    response_body?: boolean
    status_code?: boolean
    is_success?: boolean
    error_message?: boolean
    request_time?: boolean
    response_time?: boolean
    duration_ms?: boolean
    trace_id?: boolean
    called_by?: boolean
    created_at?: boolean
    is_archived?: boolean
  }, ExtArgs["result"]["apiLog"]>

  export type ApiLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service_name?: boolean
    endpoint?: boolean
    url?: boolean
    method?: boolean
    ip_address?: boolean
    user_agent?: boolean
    request_header?: boolean
    request_body?: boolean
    response_body?: boolean
    status_code?: boolean
    is_success?: boolean
    error_message?: boolean
    request_time?: boolean
    response_time?: boolean
    duration_ms?: boolean
    trace_id?: boolean
    called_by?: boolean
    created_at?: boolean
    is_archived?: boolean
  }, ExtArgs["result"]["apiLog"]>

  export type ApiLogSelectScalar = {
    id?: boolean
    service_name?: boolean
    endpoint?: boolean
    url?: boolean
    method?: boolean
    ip_address?: boolean
    user_agent?: boolean
    request_header?: boolean
    request_body?: boolean
    response_body?: boolean
    status_code?: boolean
    is_success?: boolean
    error_message?: boolean
    request_time?: boolean
    response_time?: boolean
    duration_ms?: boolean
    trace_id?: boolean
    called_by?: boolean
    created_at?: boolean
    is_archived?: boolean
  }

  export type ApiLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service_name" | "endpoint" | "url" | "method" | "ip_address" | "user_agent" | "request_header" | "request_body" | "response_body" | "status_code" | "is_success" | "error_message" | "request_time" | "response_time" | "duration_ms" | "trace_id" | "called_by" | "created_at" | "is_archived", ExtArgs["result"]["apiLog"]>

  export type $ApiLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ApiLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      service_name: string | null
      endpoint: string | null
      url: string | null
      method: string | null
      ip_address: string | null
      user_agent: string | null
      request_header: Prisma.JsonValue | null
      request_body: Prisma.JsonValue | null
      response_body: Prisma.JsonValue | null
      status_code: number | null
      is_success: boolean
      error_message: string | null
      request_time: Date
      response_time: Date | null
      duration_ms: number | null
      trace_id: string | null
      called_by: string | null
      created_at: Date
      is_archived: boolean
    }, ExtArgs["result"]["apiLog"]>
    composites: {}
  }

  type ApiLogGetPayload<S extends boolean | null | undefined | ApiLogDefaultArgs> = $Result.GetResult<Prisma.$ApiLogPayload, S>

  type ApiLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ApiLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ApiLogCountAggregateInputType | true
    }

  export interface ApiLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ApiLog'], meta: { name: 'ApiLog' } }
    /**
     * Find zero or one ApiLog that matches the filter.
     * @param {ApiLogFindUniqueArgs} args - Arguments to find a ApiLog
     * @example
     * // Get one ApiLog
     * const apiLog = await prisma.apiLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ApiLogFindUniqueArgs>(args: SelectSubset<T, ApiLogFindUniqueArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ApiLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ApiLogFindUniqueOrThrowArgs} args - Arguments to find a ApiLog
     * @example
     * // Get one ApiLog
     * const apiLog = await prisma.apiLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ApiLogFindUniqueOrThrowArgs>(args: SelectSubset<T, ApiLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ApiLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogFindFirstArgs} args - Arguments to find a ApiLog
     * @example
     * // Get one ApiLog
     * const apiLog = await prisma.apiLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ApiLogFindFirstArgs>(args?: SelectSubset<T, ApiLogFindFirstArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ApiLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogFindFirstOrThrowArgs} args - Arguments to find a ApiLog
     * @example
     * // Get one ApiLog
     * const apiLog = await prisma.apiLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ApiLogFindFirstOrThrowArgs>(args?: SelectSubset<T, ApiLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ApiLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ApiLogs
     * const apiLogs = await prisma.apiLog.findMany()
     * 
     * // Get first 10 ApiLogs
     * const apiLogs = await prisma.apiLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const apiLogWithIdOnly = await prisma.apiLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ApiLogFindManyArgs>(args?: SelectSubset<T, ApiLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ApiLog.
     * @param {ApiLogCreateArgs} args - Arguments to create a ApiLog.
     * @example
     * // Create one ApiLog
     * const ApiLog = await prisma.apiLog.create({
     *   data: {
     *     // ... data to create a ApiLog
     *   }
     * })
     * 
     */
    create<T extends ApiLogCreateArgs>(args: SelectSubset<T, ApiLogCreateArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ApiLogs.
     * @param {ApiLogCreateManyArgs} args - Arguments to create many ApiLogs.
     * @example
     * // Create many ApiLogs
     * const apiLog = await prisma.apiLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ApiLogCreateManyArgs>(args?: SelectSubset<T, ApiLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ApiLogs and returns the data saved in the database.
     * @param {ApiLogCreateManyAndReturnArgs} args - Arguments to create many ApiLogs.
     * @example
     * // Create many ApiLogs
     * const apiLog = await prisma.apiLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ApiLogs and only return the `id`
     * const apiLogWithIdOnly = await prisma.apiLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ApiLogCreateManyAndReturnArgs>(args?: SelectSubset<T, ApiLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ApiLog.
     * @param {ApiLogDeleteArgs} args - Arguments to delete one ApiLog.
     * @example
     * // Delete one ApiLog
     * const ApiLog = await prisma.apiLog.delete({
     *   where: {
     *     // ... filter to delete one ApiLog
     *   }
     * })
     * 
     */
    delete<T extends ApiLogDeleteArgs>(args: SelectSubset<T, ApiLogDeleteArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ApiLog.
     * @param {ApiLogUpdateArgs} args - Arguments to update one ApiLog.
     * @example
     * // Update one ApiLog
     * const apiLog = await prisma.apiLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ApiLogUpdateArgs>(args: SelectSubset<T, ApiLogUpdateArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ApiLogs.
     * @param {ApiLogDeleteManyArgs} args - Arguments to filter ApiLogs to delete.
     * @example
     * // Delete a few ApiLogs
     * const { count } = await prisma.apiLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ApiLogDeleteManyArgs>(args?: SelectSubset<T, ApiLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ApiLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ApiLogs
     * const apiLog = await prisma.apiLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ApiLogUpdateManyArgs>(args: SelectSubset<T, ApiLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ApiLogs and returns the data updated in the database.
     * @param {ApiLogUpdateManyAndReturnArgs} args - Arguments to update many ApiLogs.
     * @example
     * // Update many ApiLogs
     * const apiLog = await prisma.apiLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ApiLogs and only return the `id`
     * const apiLogWithIdOnly = await prisma.apiLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ApiLogUpdateManyAndReturnArgs>(args: SelectSubset<T, ApiLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ApiLog.
     * @param {ApiLogUpsertArgs} args - Arguments to update or create a ApiLog.
     * @example
     * // Update or create a ApiLog
     * const apiLog = await prisma.apiLog.upsert({
     *   create: {
     *     // ... data to create a ApiLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ApiLog we want to update
     *   }
     * })
     */
    upsert<T extends ApiLogUpsertArgs>(args: SelectSubset<T, ApiLogUpsertArgs<ExtArgs>>): Prisma__ApiLogClient<$Result.GetResult<Prisma.$ApiLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ApiLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogCountArgs} args - Arguments to filter ApiLogs to count.
     * @example
     * // Count the number of ApiLogs
     * const count = await prisma.apiLog.count({
     *   where: {
     *     // ... the filter for the ApiLogs we want to count
     *   }
     * })
    **/
    count<T extends ApiLogCountArgs>(
      args?: Subset<T, ApiLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ApiLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ApiLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ApiLogAggregateArgs>(args: Subset<T, ApiLogAggregateArgs>): Prisma.PrismaPromise<GetApiLogAggregateType<T>>

    /**
     * Group by ApiLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ApiLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ApiLogGroupByArgs['orderBy'] }
        : { orderBy?: ApiLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ApiLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetApiLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ApiLog model
   */
  readonly fields: ApiLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ApiLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ApiLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ApiLog model
   */
  interface ApiLogFieldRefs {
    readonly id: FieldRef<"ApiLog", 'BigInt'>
    readonly service_name: FieldRef<"ApiLog", 'String'>
    readonly endpoint: FieldRef<"ApiLog", 'String'>
    readonly url: FieldRef<"ApiLog", 'String'>
    readonly method: FieldRef<"ApiLog", 'String'>
    readonly ip_address: FieldRef<"ApiLog", 'String'>
    readonly user_agent: FieldRef<"ApiLog", 'String'>
    readonly request_header: FieldRef<"ApiLog", 'Json'>
    readonly request_body: FieldRef<"ApiLog", 'Json'>
    readonly response_body: FieldRef<"ApiLog", 'Json'>
    readonly status_code: FieldRef<"ApiLog", 'Int'>
    readonly is_success: FieldRef<"ApiLog", 'Boolean'>
    readonly error_message: FieldRef<"ApiLog", 'String'>
    readonly request_time: FieldRef<"ApiLog", 'DateTime'>
    readonly response_time: FieldRef<"ApiLog", 'DateTime'>
    readonly duration_ms: FieldRef<"ApiLog", 'Int'>
    readonly trace_id: FieldRef<"ApiLog", 'String'>
    readonly called_by: FieldRef<"ApiLog", 'String'>
    readonly created_at: FieldRef<"ApiLog", 'DateTime'>
    readonly is_archived: FieldRef<"ApiLog", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * ApiLog findUnique
   */
  export type ApiLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * Filter, which ApiLog to fetch.
     */
    where: ApiLogWhereUniqueInput
  }

  /**
   * ApiLog findUniqueOrThrow
   */
  export type ApiLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * Filter, which ApiLog to fetch.
     */
    where: ApiLogWhereUniqueInput
  }

  /**
   * ApiLog findFirst
   */
  export type ApiLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * Filter, which ApiLog to fetch.
     */
    where?: ApiLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiLogs to fetch.
     */
    orderBy?: ApiLogOrderByWithRelationInput | ApiLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ApiLogs.
     */
    cursor?: ApiLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiLogs.
     */
    distinct?: ApiLogScalarFieldEnum | ApiLogScalarFieldEnum[]
  }

  /**
   * ApiLog findFirstOrThrow
   */
  export type ApiLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * Filter, which ApiLog to fetch.
     */
    where?: ApiLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiLogs to fetch.
     */
    orderBy?: ApiLogOrderByWithRelationInput | ApiLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ApiLogs.
     */
    cursor?: ApiLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiLogs.
     */
    distinct?: ApiLogScalarFieldEnum | ApiLogScalarFieldEnum[]
  }

  /**
   * ApiLog findMany
   */
  export type ApiLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * Filter, which ApiLogs to fetch.
     */
    where?: ApiLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiLogs to fetch.
     */
    orderBy?: ApiLogOrderByWithRelationInput | ApiLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ApiLogs.
     */
    cursor?: ApiLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiLogs.
     */
    skip?: number
    distinct?: ApiLogScalarFieldEnum | ApiLogScalarFieldEnum[]
  }

  /**
   * ApiLog create
   */
  export type ApiLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * The data needed to create a ApiLog.
     */
    data: XOR<ApiLogCreateInput, ApiLogUncheckedCreateInput>
  }

  /**
   * ApiLog createMany
   */
  export type ApiLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ApiLogs.
     */
    data: ApiLogCreateManyInput | ApiLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ApiLog createManyAndReturn
   */
  export type ApiLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * The data used to create many ApiLogs.
     */
    data: ApiLogCreateManyInput | ApiLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ApiLog update
   */
  export type ApiLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * The data needed to update a ApiLog.
     */
    data: XOR<ApiLogUpdateInput, ApiLogUncheckedUpdateInput>
    /**
     * Choose, which ApiLog to update.
     */
    where: ApiLogWhereUniqueInput
  }

  /**
   * ApiLog updateMany
   */
  export type ApiLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ApiLogs.
     */
    data: XOR<ApiLogUpdateManyMutationInput, ApiLogUncheckedUpdateManyInput>
    /**
     * Filter which ApiLogs to update
     */
    where?: ApiLogWhereInput
    /**
     * Limit how many ApiLogs to update.
     */
    limit?: number
  }

  /**
   * ApiLog updateManyAndReturn
   */
  export type ApiLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * The data used to update ApiLogs.
     */
    data: XOR<ApiLogUpdateManyMutationInput, ApiLogUncheckedUpdateManyInput>
    /**
     * Filter which ApiLogs to update
     */
    where?: ApiLogWhereInput
    /**
     * Limit how many ApiLogs to update.
     */
    limit?: number
  }

  /**
   * ApiLog upsert
   */
  export type ApiLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * The filter to search for the ApiLog to update in case it exists.
     */
    where: ApiLogWhereUniqueInput
    /**
     * In case the ApiLog found by the `where` argument doesn't exist, create a new ApiLog with this data.
     */
    create: XOR<ApiLogCreateInput, ApiLogUncheckedCreateInput>
    /**
     * In case the ApiLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ApiLogUpdateInput, ApiLogUncheckedUpdateInput>
  }

  /**
   * ApiLog delete
   */
  export type ApiLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
    /**
     * Filter which ApiLog to delete.
     */
    where: ApiLogWhereUniqueInput
  }

  /**
   * ApiLog deleteMany
   */
  export type ApiLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ApiLogs to delete
     */
    where?: ApiLogWhereInput
    /**
     * Limit how many ApiLogs to delete.
     */
    limit?: number
  }

  /**
   * ApiLog without action
   */
  export type ApiLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiLog
     */
    select?: ApiLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiLog
     */
    omit?: ApiLogOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const GroupScalarFieldEnum: {
    id: 'id',
    name_th: 'name_th',
    name_en: 'name_en'
  };

  export type GroupScalarFieldEnum = (typeof GroupScalarFieldEnum)[keyof typeof GroupScalarFieldEnum]


  export const ProjectStatusScalarFieldEnum: {
    id: 'id',
    priority: 'priority',
    nameTh: 'nameTh',
    nameEn: 'nameEn'
  };

  export type ProjectStatusScalarFieldEnum = (typeof ProjectStatusScalarFieldEnum)[keyof typeof ProjectStatusScalarFieldEnum]


  export const ProjectScalarFieldEnum: {
    id: 'id',
    name: 'name',
    name_en: 'name_en',
    description: 'description',
    categoryType: 'categoryType',
    approval: 'approval',
    approval_status: 'approval_status',
    status: 'status',
    start_date: 'start_date',
    end_date: 'end_date',
    completeDate: 'completeDate',
    estimateWorkhours: 'estimateWorkhours',
    group_id: 'group_id',
    projectStatusId: 'projectStatusId',
    is_deleted: 'is_deleted',
    createdAt: 'createdAt',
    createdBy: 'createdBy',
    updatedAt: 'updatedAt',
    updatedBy: 'updatedBy'
  };

  export type ProjectScalarFieldEnum = (typeof ProjectScalarFieldEnum)[keyof typeof ProjectScalarFieldEnum]


  export const FeatureScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    name: 'name',
    name_en: 'name_en',
    status: 'status',
    assetCaptureType: 'assetCaptureType',
    backlogDescription: 'backlogDescription',
    startDate: 'startDate',
    endDate: 'endDate',
    completeDate: 'completeDate',
    estimateWorkhours: 'estimateWorkhours',
    projectStatusId: 'projectStatusId',
    is_deleted: 'is_deleted',
    createdAt: 'createdAt',
    createdBy: 'createdBy',
    updatedAt: 'updatedAt',
    updatedBy: 'updatedBy'
  };

  export type FeatureScalarFieldEnum = (typeof FeatureScalarFieldEnum)[keyof typeof FeatureScalarFieldEnum]


  export const ProjectAssigneeScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    projectId: 'projectId',
    featureId: 'featureId',
    position: 'position'
  };

  export type ProjectAssigneeScalarFieldEnum = (typeof ProjectAssigneeScalarFieldEnum)[keyof typeof ProjectAssigneeScalarFieldEnum]


  export const TimesheetEntryScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    featureId: 'featureId',
    date: 'date',
    hours: 'hours',
    description: 'description',
    status: 'status',
    is_deleted: 'is_deleted',
    createdAt: 'createdAt',
    createdBy: 'createdBy',
    updatedAt: 'updatedAt',
    updatedBy: 'updatedBy'
  };

  export type TimesheetEntryScalarFieldEnum = (typeof TimesheetEntryScalarFieldEnum)[keyof typeof TimesheetEntryScalarFieldEnum]


  export const OvertimeScalarFieldEnum: {
    id: 'id',
    requesterId: 'requesterId',
    requestDate: 'requestDate',
    status: 'status',
    isDeleted: 'isDeleted',
    createdAt: 'createdAt',
    createdBy: 'createdBy',
    updatedAt: 'updatedAt',
    updatedBy: 'updatedBy'
  };

  export type OvertimeScalarFieldEnum = (typeof OvertimeScalarFieldEnum)[keyof typeof OvertimeScalarFieldEnum]


  export const OvertimeDescriptionScalarFieldEnum: {
    id: 'id',
    overtimeId: 'overtimeId',
    assignee: 'assignee',
    description: 'description',
    duration: 'duration',
    date: 'date',
    startDate: 'startDate',
    endDate: 'endDate'
  };

  export type OvertimeDescriptionScalarFieldEnum = (typeof OvertimeDescriptionScalarFieldEnum)[keyof typeof OvertimeDescriptionScalarFieldEnum]


  export const ApiLogScalarFieldEnum: {
    id: 'id',
    service_name: 'service_name',
    endpoint: 'endpoint',
    url: 'url',
    method: 'method',
    ip_address: 'ip_address',
    user_agent: 'user_agent',
    request_header: 'request_header',
    request_body: 'request_body',
    response_body: 'response_body',
    status_code: 'status_code',
    is_success: 'is_success',
    error_message: 'error_message',
    request_time: 'request_time',
    response_time: 'response_time',
    duration_ms: 'duration_ms',
    trace_id: 'trace_id',
    called_by: 'called_by',
    created_at: 'created_at',
    is_archived: 'is_archived'
  };

  export type ApiLogScalarFieldEnum = (typeof ApiLogScalarFieldEnum)[keyof typeof ApiLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'ProjectAssetCaptureType'
   */
  export type EnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectAssetCaptureType'>
    


  /**
   * Reference to a field of type 'ProjectAssetCaptureType[]'
   */
  export type ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectAssetCaptureType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type GroupWhereInput = {
    AND?: GroupWhereInput | GroupWhereInput[]
    OR?: GroupWhereInput[]
    NOT?: GroupWhereInput | GroupWhereInput[]
    id?: IntFilter<"Group"> | number
    name_th?: StringFilter<"Group"> | string
    name_en?: StringNullableFilter<"Group"> | string | null
    projects?: ProjectListRelationFilter
  }

  export type GroupOrderByWithRelationInput = {
    id?: SortOrder
    name_th?: SortOrder
    name_en?: SortOrderInput | SortOrder
    projects?: ProjectOrderByRelationAggregateInput
  }

  export type GroupWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: GroupWhereInput | GroupWhereInput[]
    OR?: GroupWhereInput[]
    NOT?: GroupWhereInput | GroupWhereInput[]
    name_th?: StringFilter<"Group"> | string
    name_en?: StringNullableFilter<"Group"> | string | null
    projects?: ProjectListRelationFilter
  }, "id">

  export type GroupOrderByWithAggregationInput = {
    id?: SortOrder
    name_th?: SortOrder
    name_en?: SortOrderInput | SortOrder
    _count?: GroupCountOrderByAggregateInput
    _avg?: GroupAvgOrderByAggregateInput
    _max?: GroupMaxOrderByAggregateInput
    _min?: GroupMinOrderByAggregateInput
    _sum?: GroupSumOrderByAggregateInput
  }

  export type GroupScalarWhereWithAggregatesInput = {
    AND?: GroupScalarWhereWithAggregatesInput | GroupScalarWhereWithAggregatesInput[]
    OR?: GroupScalarWhereWithAggregatesInput[]
    NOT?: GroupScalarWhereWithAggregatesInput | GroupScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Group"> | number
    name_th?: StringWithAggregatesFilter<"Group"> | string
    name_en?: StringNullableWithAggregatesFilter<"Group"> | string | null
  }

  export type ProjectStatusWhereInput = {
    AND?: ProjectStatusWhereInput | ProjectStatusWhereInput[]
    OR?: ProjectStatusWhereInput[]
    NOT?: ProjectStatusWhereInput | ProjectStatusWhereInput[]
    id?: IntFilter<"ProjectStatus"> | number
    priority?: IntFilter<"ProjectStatus"> | number
    nameTh?: StringFilter<"ProjectStatus"> | string
    nameEn?: StringNullableFilter<"ProjectStatus"> | string | null
    projects?: ProjectListRelationFilter
    features?: FeatureListRelationFilter
  }

  export type ProjectStatusOrderByWithRelationInput = {
    id?: SortOrder
    priority?: SortOrder
    nameTh?: SortOrder
    nameEn?: SortOrderInput | SortOrder
    projects?: ProjectOrderByRelationAggregateInput
    features?: FeatureOrderByRelationAggregateInput
  }

  export type ProjectStatusWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: ProjectStatusWhereInput | ProjectStatusWhereInput[]
    OR?: ProjectStatusWhereInput[]
    NOT?: ProjectStatusWhereInput | ProjectStatusWhereInput[]
    priority?: IntFilter<"ProjectStatus"> | number
    nameTh?: StringFilter<"ProjectStatus"> | string
    nameEn?: StringNullableFilter<"ProjectStatus"> | string | null
    projects?: ProjectListRelationFilter
    features?: FeatureListRelationFilter
  }, "id">

  export type ProjectStatusOrderByWithAggregationInput = {
    id?: SortOrder
    priority?: SortOrder
    nameTh?: SortOrder
    nameEn?: SortOrderInput | SortOrder
    _count?: ProjectStatusCountOrderByAggregateInput
    _avg?: ProjectStatusAvgOrderByAggregateInput
    _max?: ProjectStatusMaxOrderByAggregateInput
    _min?: ProjectStatusMinOrderByAggregateInput
    _sum?: ProjectStatusSumOrderByAggregateInput
  }

  export type ProjectStatusScalarWhereWithAggregatesInput = {
    AND?: ProjectStatusScalarWhereWithAggregatesInput | ProjectStatusScalarWhereWithAggregatesInput[]
    OR?: ProjectStatusScalarWhereWithAggregatesInput[]
    NOT?: ProjectStatusScalarWhereWithAggregatesInput | ProjectStatusScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"ProjectStatus"> | number
    priority?: IntWithAggregatesFilter<"ProjectStatus"> | number
    nameTh?: StringWithAggregatesFilter<"ProjectStatus"> | string
    nameEn?: StringNullableWithAggregatesFilter<"ProjectStatus"> | string | null
  }

  export type ProjectWhereInput = {
    AND?: ProjectWhereInput | ProjectWhereInput[]
    OR?: ProjectWhereInput[]
    NOT?: ProjectWhereInput | ProjectWhereInput[]
    id?: IntFilter<"Project"> | number
    name?: StringFilter<"Project"> | string
    name_en?: StringNullableFilter<"Project"> | string | null
    description?: StringFilter<"Project"> | string
    categoryType?: StringNullableFilter<"Project"> | string | null
    approval?: StringFilter<"Project"> | string
    approval_status?: StringFilter<"Project"> | string
    status?: StringFilter<"Project"> | string
    start_date?: DateTimeNullableFilter<"Project"> | Date | string | null
    end_date?: DateTimeNullableFilter<"Project"> | Date | string | null
    completeDate?: DateTimeNullableFilter<"Project"> | Date | string | null
    estimateWorkhours?: DecimalNullableFilter<"Project"> | Decimal | DecimalJsLike | number | string | null
    group_id?: IntNullableFilter<"Project"> | number | null
    projectStatusId?: IntNullableFilter<"Project"> | number | null
    is_deleted?: BoolFilter<"Project"> | boolean
    createdAt?: DateTimeFilter<"Project"> | Date | string
    createdBy?: IntNullableFilter<"Project"> | number | null
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    updatedBy?: IntNullableFilter<"Project"> | number | null
    group?: XOR<GroupNullableScalarRelationFilter, GroupWhereInput> | null
    projectStatus?: XOR<ProjectStatusNullableScalarRelationFilter, ProjectStatusWhereInput> | null
    features?: FeatureListRelationFilter
    projectAssignees?: ProjectAssigneeListRelationFilter
    timesheets?: TimesheetEntryListRelationFilter
  }

  export type ProjectOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    name_en?: SortOrderInput | SortOrder
    description?: SortOrder
    categoryType?: SortOrderInput | SortOrder
    approval?: SortOrder
    approval_status?: SortOrder
    status?: SortOrder
    start_date?: SortOrderInput | SortOrder
    end_date?: SortOrderInput | SortOrder
    completeDate?: SortOrderInput | SortOrder
    estimateWorkhours?: SortOrderInput | SortOrder
    group_id?: SortOrderInput | SortOrder
    projectStatusId?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    group?: GroupOrderByWithRelationInput
    projectStatus?: ProjectStatusOrderByWithRelationInput
    features?: FeatureOrderByRelationAggregateInput
    projectAssignees?: ProjectAssigneeOrderByRelationAggregateInput
    timesheets?: TimesheetEntryOrderByRelationAggregateInput
  }

  export type ProjectWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: ProjectWhereInput | ProjectWhereInput[]
    OR?: ProjectWhereInput[]
    NOT?: ProjectWhereInput | ProjectWhereInput[]
    name?: StringFilter<"Project"> | string
    name_en?: StringNullableFilter<"Project"> | string | null
    description?: StringFilter<"Project"> | string
    categoryType?: StringNullableFilter<"Project"> | string | null
    approval?: StringFilter<"Project"> | string
    approval_status?: StringFilter<"Project"> | string
    status?: StringFilter<"Project"> | string
    start_date?: DateTimeNullableFilter<"Project"> | Date | string | null
    end_date?: DateTimeNullableFilter<"Project"> | Date | string | null
    completeDate?: DateTimeNullableFilter<"Project"> | Date | string | null
    estimateWorkhours?: DecimalNullableFilter<"Project"> | Decimal | DecimalJsLike | number | string | null
    group_id?: IntNullableFilter<"Project"> | number | null
    projectStatusId?: IntNullableFilter<"Project"> | number | null
    is_deleted?: BoolFilter<"Project"> | boolean
    createdAt?: DateTimeFilter<"Project"> | Date | string
    createdBy?: IntNullableFilter<"Project"> | number | null
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    updatedBy?: IntNullableFilter<"Project"> | number | null
    group?: XOR<GroupNullableScalarRelationFilter, GroupWhereInput> | null
    projectStatus?: XOR<ProjectStatusNullableScalarRelationFilter, ProjectStatusWhereInput> | null
    features?: FeatureListRelationFilter
    projectAssignees?: ProjectAssigneeListRelationFilter
    timesheets?: TimesheetEntryListRelationFilter
  }, "id">

  export type ProjectOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    name_en?: SortOrderInput | SortOrder
    description?: SortOrder
    categoryType?: SortOrderInput | SortOrder
    approval?: SortOrder
    approval_status?: SortOrder
    status?: SortOrder
    start_date?: SortOrderInput | SortOrder
    end_date?: SortOrderInput | SortOrder
    completeDate?: SortOrderInput | SortOrder
    estimateWorkhours?: SortOrderInput | SortOrder
    group_id?: SortOrderInput | SortOrder
    projectStatusId?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    _count?: ProjectCountOrderByAggregateInput
    _avg?: ProjectAvgOrderByAggregateInput
    _max?: ProjectMaxOrderByAggregateInput
    _min?: ProjectMinOrderByAggregateInput
    _sum?: ProjectSumOrderByAggregateInput
  }

  export type ProjectScalarWhereWithAggregatesInput = {
    AND?: ProjectScalarWhereWithAggregatesInput | ProjectScalarWhereWithAggregatesInput[]
    OR?: ProjectScalarWhereWithAggregatesInput[]
    NOT?: ProjectScalarWhereWithAggregatesInput | ProjectScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Project"> | number
    name?: StringWithAggregatesFilter<"Project"> | string
    name_en?: StringNullableWithAggregatesFilter<"Project"> | string | null
    description?: StringWithAggregatesFilter<"Project"> | string
    categoryType?: StringNullableWithAggregatesFilter<"Project"> | string | null
    approval?: StringWithAggregatesFilter<"Project"> | string
    approval_status?: StringWithAggregatesFilter<"Project"> | string
    status?: StringWithAggregatesFilter<"Project"> | string
    start_date?: DateTimeNullableWithAggregatesFilter<"Project"> | Date | string | null
    end_date?: DateTimeNullableWithAggregatesFilter<"Project"> | Date | string | null
    completeDate?: DateTimeNullableWithAggregatesFilter<"Project"> | Date | string | null
    estimateWorkhours?: DecimalNullableWithAggregatesFilter<"Project"> | Decimal | DecimalJsLike | number | string | null
    group_id?: IntNullableWithAggregatesFilter<"Project"> | number | null
    projectStatusId?: IntNullableWithAggregatesFilter<"Project"> | number | null
    is_deleted?: BoolWithAggregatesFilter<"Project"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Project"> | Date | string
    createdBy?: IntNullableWithAggregatesFilter<"Project"> | number | null
    updatedAt?: DateTimeWithAggregatesFilter<"Project"> | Date | string
    updatedBy?: IntNullableWithAggregatesFilter<"Project"> | number | null
  }

  export type FeatureWhereInput = {
    AND?: FeatureWhereInput | FeatureWhereInput[]
    OR?: FeatureWhereInput[]
    NOT?: FeatureWhereInput | FeatureWhereInput[]
    id?: IntFilter<"Feature"> | number
    projectId?: IntFilter<"Feature"> | number
    name?: StringFilter<"Feature"> | string
    name_en?: StringNullableFilter<"Feature"> | string | null
    status?: StringFilter<"Feature"> | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFilter<"Feature"> | $Enums.ProjectAssetCaptureType
    backlogDescription?: JsonNullableFilter<"Feature">
    startDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    completeDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    estimateWorkhours?: DecimalNullableFilter<"Feature"> | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: IntNullableFilter<"Feature"> | number | null
    is_deleted?: BoolFilter<"Feature"> | boolean
    createdAt?: DateTimeFilter<"Feature"> | Date | string
    createdBy?: IntNullableFilter<"Feature"> | number | null
    updatedAt?: DateTimeFilter<"Feature"> | Date | string
    updatedBy?: IntNullableFilter<"Feature"> | number | null
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    projectStatus?: XOR<ProjectStatusNullableScalarRelationFilter, ProjectStatusWhereInput> | null
    projectAssignees?: ProjectAssigneeListRelationFilter
    timesheets?: TimesheetEntryListRelationFilter
  }

  export type FeatureOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    name?: SortOrder
    name_en?: SortOrderInput | SortOrder
    status?: SortOrder
    assetCaptureType?: SortOrder
    backlogDescription?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    completeDate?: SortOrderInput | SortOrder
    estimateWorkhours?: SortOrderInput | SortOrder
    projectStatusId?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    project?: ProjectOrderByWithRelationInput
    projectStatus?: ProjectStatusOrderByWithRelationInput
    projectAssignees?: ProjectAssigneeOrderByRelationAggregateInput
    timesheets?: TimesheetEntryOrderByRelationAggregateInput
  }

  export type FeatureWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: FeatureWhereInput | FeatureWhereInput[]
    OR?: FeatureWhereInput[]
    NOT?: FeatureWhereInput | FeatureWhereInput[]
    projectId?: IntFilter<"Feature"> | number
    name?: StringFilter<"Feature"> | string
    name_en?: StringNullableFilter<"Feature"> | string | null
    status?: StringFilter<"Feature"> | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFilter<"Feature"> | $Enums.ProjectAssetCaptureType
    backlogDescription?: JsonNullableFilter<"Feature">
    startDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    completeDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    estimateWorkhours?: DecimalNullableFilter<"Feature"> | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: IntNullableFilter<"Feature"> | number | null
    is_deleted?: BoolFilter<"Feature"> | boolean
    createdAt?: DateTimeFilter<"Feature"> | Date | string
    createdBy?: IntNullableFilter<"Feature"> | number | null
    updatedAt?: DateTimeFilter<"Feature"> | Date | string
    updatedBy?: IntNullableFilter<"Feature"> | number | null
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    projectStatus?: XOR<ProjectStatusNullableScalarRelationFilter, ProjectStatusWhereInput> | null
    projectAssignees?: ProjectAssigneeListRelationFilter
    timesheets?: TimesheetEntryListRelationFilter
  }, "id">

  export type FeatureOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    name?: SortOrder
    name_en?: SortOrderInput | SortOrder
    status?: SortOrder
    assetCaptureType?: SortOrder
    backlogDescription?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    completeDate?: SortOrderInput | SortOrder
    estimateWorkhours?: SortOrderInput | SortOrder
    projectStatusId?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    _count?: FeatureCountOrderByAggregateInput
    _avg?: FeatureAvgOrderByAggregateInput
    _max?: FeatureMaxOrderByAggregateInput
    _min?: FeatureMinOrderByAggregateInput
    _sum?: FeatureSumOrderByAggregateInput
  }

  export type FeatureScalarWhereWithAggregatesInput = {
    AND?: FeatureScalarWhereWithAggregatesInput | FeatureScalarWhereWithAggregatesInput[]
    OR?: FeatureScalarWhereWithAggregatesInput[]
    NOT?: FeatureScalarWhereWithAggregatesInput | FeatureScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Feature"> | number
    projectId?: IntWithAggregatesFilter<"Feature"> | number
    name?: StringWithAggregatesFilter<"Feature"> | string
    name_en?: StringNullableWithAggregatesFilter<"Feature"> | string | null
    status?: StringWithAggregatesFilter<"Feature"> | string
    assetCaptureType?: EnumProjectAssetCaptureTypeWithAggregatesFilter<"Feature"> | $Enums.ProjectAssetCaptureType
    backlogDescription?: JsonNullableWithAggregatesFilter<"Feature">
    startDate?: DateTimeNullableWithAggregatesFilter<"Feature"> | Date | string | null
    endDate?: DateTimeNullableWithAggregatesFilter<"Feature"> | Date | string | null
    completeDate?: DateTimeNullableWithAggregatesFilter<"Feature"> | Date | string | null
    estimateWorkhours?: DecimalNullableWithAggregatesFilter<"Feature"> | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: IntNullableWithAggregatesFilter<"Feature"> | number | null
    is_deleted?: BoolWithAggregatesFilter<"Feature"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Feature"> | Date | string
    createdBy?: IntNullableWithAggregatesFilter<"Feature"> | number | null
    updatedAt?: DateTimeWithAggregatesFilter<"Feature"> | Date | string
    updatedBy?: IntNullableWithAggregatesFilter<"Feature"> | number | null
  }

  export type ProjectAssigneeWhereInput = {
    AND?: ProjectAssigneeWhereInput | ProjectAssigneeWhereInput[]
    OR?: ProjectAssigneeWhereInput[]
    NOT?: ProjectAssigneeWhereInput | ProjectAssigneeWhereInput[]
    id?: IntFilter<"ProjectAssignee"> | number
    userId?: IntFilter<"ProjectAssignee"> | number
    projectId?: IntFilter<"ProjectAssignee"> | number
    featureId?: IntNullableFilter<"ProjectAssignee"> | number | null
    position?: StringNullableFilter<"ProjectAssignee"> | string | null
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    feature?: XOR<FeatureNullableScalarRelationFilter, FeatureWhereInput> | null
  }

  export type ProjectAssigneeOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrderInput | SortOrder
    position?: SortOrderInput | SortOrder
    project?: ProjectOrderByWithRelationInput
    feature?: FeatureOrderByWithRelationInput
  }

  export type ProjectAssigneeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: ProjectAssigneeWhereInput | ProjectAssigneeWhereInput[]
    OR?: ProjectAssigneeWhereInput[]
    NOT?: ProjectAssigneeWhereInput | ProjectAssigneeWhereInput[]
    userId?: IntFilter<"ProjectAssignee"> | number
    projectId?: IntFilter<"ProjectAssignee"> | number
    featureId?: IntNullableFilter<"ProjectAssignee"> | number | null
    position?: StringNullableFilter<"ProjectAssignee"> | string | null
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
    feature?: XOR<FeatureNullableScalarRelationFilter, FeatureWhereInput> | null
  }, "id">

  export type ProjectAssigneeOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrderInput | SortOrder
    position?: SortOrderInput | SortOrder
    _count?: ProjectAssigneeCountOrderByAggregateInput
    _avg?: ProjectAssigneeAvgOrderByAggregateInput
    _max?: ProjectAssigneeMaxOrderByAggregateInput
    _min?: ProjectAssigneeMinOrderByAggregateInput
    _sum?: ProjectAssigneeSumOrderByAggregateInput
  }

  export type ProjectAssigneeScalarWhereWithAggregatesInput = {
    AND?: ProjectAssigneeScalarWhereWithAggregatesInput | ProjectAssigneeScalarWhereWithAggregatesInput[]
    OR?: ProjectAssigneeScalarWhereWithAggregatesInput[]
    NOT?: ProjectAssigneeScalarWhereWithAggregatesInput | ProjectAssigneeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"ProjectAssignee"> | number
    userId?: IntWithAggregatesFilter<"ProjectAssignee"> | number
    projectId?: IntWithAggregatesFilter<"ProjectAssignee"> | number
    featureId?: IntNullableWithAggregatesFilter<"ProjectAssignee"> | number | null
    position?: StringNullableWithAggregatesFilter<"ProjectAssignee"> | string | null
  }

  export type TimesheetEntryWhereInput = {
    AND?: TimesheetEntryWhereInput | TimesheetEntryWhereInput[]
    OR?: TimesheetEntryWhereInput[]
    NOT?: TimesheetEntryWhereInput | TimesheetEntryWhereInput[]
    id?: IntFilter<"TimesheetEntry"> | number
    projectId?: IntFilter<"TimesheetEntry"> | number
    featureId?: IntFilter<"TimesheetEntry"> | number
    date?: DateTimeFilter<"TimesheetEntry"> | Date | string
    hours?: DecimalFilter<"TimesheetEntry"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableFilter<"TimesheetEntry"> | string | null
    status?: StringFilter<"TimesheetEntry"> | string
    is_deleted?: BoolFilter<"TimesheetEntry"> | boolean
    createdAt?: DateTimeFilter<"TimesheetEntry"> | Date | string
    createdBy?: IntNullableFilter<"TimesheetEntry"> | number | null
    updatedAt?: DateTimeFilter<"TimesheetEntry"> | Date | string
    updatedBy?: IntNullableFilter<"TimesheetEntry"> | number | null
    feature?: XOR<FeatureScalarRelationFilter, FeatureWhereInput>
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }

  export type TimesheetEntryOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    date?: SortOrder
    hours?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    feature?: FeatureOrderByWithRelationInput
    project?: ProjectOrderByWithRelationInput
  }

  export type TimesheetEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TimesheetEntryWhereInput | TimesheetEntryWhereInput[]
    OR?: TimesheetEntryWhereInput[]
    NOT?: TimesheetEntryWhereInput | TimesheetEntryWhereInput[]
    projectId?: IntFilter<"TimesheetEntry"> | number
    featureId?: IntFilter<"TimesheetEntry"> | number
    date?: DateTimeFilter<"TimesheetEntry"> | Date | string
    hours?: DecimalFilter<"TimesheetEntry"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableFilter<"TimesheetEntry"> | string | null
    status?: StringFilter<"TimesheetEntry"> | string
    is_deleted?: BoolFilter<"TimesheetEntry"> | boolean
    createdAt?: DateTimeFilter<"TimesheetEntry"> | Date | string
    createdBy?: IntNullableFilter<"TimesheetEntry"> | number | null
    updatedAt?: DateTimeFilter<"TimesheetEntry"> | Date | string
    updatedBy?: IntNullableFilter<"TimesheetEntry"> | number | null
    feature?: XOR<FeatureScalarRelationFilter, FeatureWhereInput>
    project?: XOR<ProjectScalarRelationFilter, ProjectWhereInput>
  }, "id">

  export type TimesheetEntryOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    date?: SortOrder
    hours?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    _count?: TimesheetEntryCountOrderByAggregateInput
    _avg?: TimesheetEntryAvgOrderByAggregateInput
    _max?: TimesheetEntryMaxOrderByAggregateInput
    _min?: TimesheetEntryMinOrderByAggregateInput
    _sum?: TimesheetEntrySumOrderByAggregateInput
  }

  export type TimesheetEntryScalarWhereWithAggregatesInput = {
    AND?: TimesheetEntryScalarWhereWithAggregatesInput | TimesheetEntryScalarWhereWithAggregatesInput[]
    OR?: TimesheetEntryScalarWhereWithAggregatesInput[]
    NOT?: TimesheetEntryScalarWhereWithAggregatesInput | TimesheetEntryScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TimesheetEntry"> | number
    projectId?: IntWithAggregatesFilter<"TimesheetEntry"> | number
    featureId?: IntWithAggregatesFilter<"TimesheetEntry"> | number
    date?: DateTimeWithAggregatesFilter<"TimesheetEntry"> | Date | string
    hours?: DecimalWithAggregatesFilter<"TimesheetEntry"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableWithAggregatesFilter<"TimesheetEntry"> | string | null
    status?: StringWithAggregatesFilter<"TimesheetEntry"> | string
    is_deleted?: BoolWithAggregatesFilter<"TimesheetEntry"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TimesheetEntry"> | Date | string
    createdBy?: IntNullableWithAggregatesFilter<"TimesheetEntry"> | number | null
    updatedAt?: DateTimeWithAggregatesFilter<"TimesheetEntry"> | Date | string
    updatedBy?: IntNullableWithAggregatesFilter<"TimesheetEntry"> | number | null
  }

  export type OvertimeWhereInput = {
    AND?: OvertimeWhereInput | OvertimeWhereInput[]
    OR?: OvertimeWhereInput[]
    NOT?: OvertimeWhereInput | OvertimeWhereInput[]
    id?: IntFilter<"Overtime"> | number
    requesterId?: StringFilter<"Overtime"> | string
    requestDate?: DateTimeFilter<"Overtime"> | Date | string
    status?: StringFilter<"Overtime"> | string
    isDeleted?: BoolFilter<"Overtime"> | boolean
    createdAt?: DateTimeFilter<"Overtime"> | Date | string
    createdBy?: StringFilter<"Overtime"> | string
    updatedAt?: DateTimeFilter<"Overtime"> | Date | string
    updatedBy?: StringNullableFilter<"Overtime"> | string | null
    descriptions?: OvertimeDescriptionListRelationFilter
  }

  export type OvertimeOrderByWithRelationInput = {
    id?: SortOrder
    requesterId?: SortOrder
    requestDate?: SortOrder
    status?: SortOrder
    isDeleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    descriptions?: OvertimeDescriptionOrderByRelationAggregateInput
  }

  export type OvertimeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: OvertimeWhereInput | OvertimeWhereInput[]
    OR?: OvertimeWhereInput[]
    NOT?: OvertimeWhereInput | OvertimeWhereInput[]
    requesterId?: StringFilter<"Overtime"> | string
    requestDate?: DateTimeFilter<"Overtime"> | Date | string
    status?: StringFilter<"Overtime"> | string
    isDeleted?: BoolFilter<"Overtime"> | boolean
    createdAt?: DateTimeFilter<"Overtime"> | Date | string
    createdBy?: StringFilter<"Overtime"> | string
    updatedAt?: DateTimeFilter<"Overtime"> | Date | string
    updatedBy?: StringNullableFilter<"Overtime"> | string | null
    descriptions?: OvertimeDescriptionListRelationFilter
  }, "id">

  export type OvertimeOrderByWithAggregationInput = {
    id?: SortOrder
    requesterId?: SortOrder
    requestDate?: SortOrder
    status?: SortOrder
    isDeleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    _count?: OvertimeCountOrderByAggregateInput
    _avg?: OvertimeAvgOrderByAggregateInput
    _max?: OvertimeMaxOrderByAggregateInput
    _min?: OvertimeMinOrderByAggregateInput
    _sum?: OvertimeSumOrderByAggregateInput
  }

  export type OvertimeScalarWhereWithAggregatesInput = {
    AND?: OvertimeScalarWhereWithAggregatesInput | OvertimeScalarWhereWithAggregatesInput[]
    OR?: OvertimeScalarWhereWithAggregatesInput[]
    NOT?: OvertimeScalarWhereWithAggregatesInput | OvertimeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Overtime"> | number
    requesterId?: StringWithAggregatesFilter<"Overtime"> | string
    requestDate?: DateTimeWithAggregatesFilter<"Overtime"> | Date | string
    status?: StringWithAggregatesFilter<"Overtime"> | string
    isDeleted?: BoolWithAggregatesFilter<"Overtime"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Overtime"> | Date | string
    createdBy?: StringWithAggregatesFilter<"Overtime"> | string
    updatedAt?: DateTimeWithAggregatesFilter<"Overtime"> | Date | string
    updatedBy?: StringNullableWithAggregatesFilter<"Overtime"> | string | null
  }

  export type OvertimeDescriptionWhereInput = {
    AND?: OvertimeDescriptionWhereInput | OvertimeDescriptionWhereInput[]
    OR?: OvertimeDescriptionWhereInput[]
    NOT?: OvertimeDescriptionWhereInput | OvertimeDescriptionWhereInput[]
    id?: IntFilter<"OvertimeDescription"> | number
    overtimeId?: IntFilter<"OvertimeDescription"> | number
    assignee?: StringFilter<"OvertimeDescription"> | string
    description?: StringFilter<"OvertimeDescription"> | string
    duration?: DecimalFilter<"OvertimeDescription"> | Decimal | DecimalJsLike | number | string
    date?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    startDate?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    endDate?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    overtime?: XOR<OvertimeScalarRelationFilter, OvertimeWhereInput>
  }

  export type OvertimeDescriptionOrderByWithRelationInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    assignee?: SortOrder
    description?: SortOrder
    duration?: SortOrder
    date?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    overtime?: OvertimeOrderByWithRelationInput
  }

  export type OvertimeDescriptionWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: OvertimeDescriptionWhereInput | OvertimeDescriptionWhereInput[]
    OR?: OvertimeDescriptionWhereInput[]
    NOT?: OvertimeDescriptionWhereInput | OvertimeDescriptionWhereInput[]
    overtimeId?: IntFilter<"OvertimeDescription"> | number
    assignee?: StringFilter<"OvertimeDescription"> | string
    description?: StringFilter<"OvertimeDescription"> | string
    duration?: DecimalFilter<"OvertimeDescription"> | Decimal | DecimalJsLike | number | string
    date?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    startDate?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    endDate?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    overtime?: XOR<OvertimeScalarRelationFilter, OvertimeWhereInput>
  }, "id">

  export type OvertimeDescriptionOrderByWithAggregationInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    assignee?: SortOrder
    description?: SortOrder
    duration?: SortOrder
    date?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    _count?: OvertimeDescriptionCountOrderByAggregateInput
    _avg?: OvertimeDescriptionAvgOrderByAggregateInput
    _max?: OvertimeDescriptionMaxOrderByAggregateInput
    _min?: OvertimeDescriptionMinOrderByAggregateInput
    _sum?: OvertimeDescriptionSumOrderByAggregateInput
  }

  export type OvertimeDescriptionScalarWhereWithAggregatesInput = {
    AND?: OvertimeDescriptionScalarWhereWithAggregatesInput | OvertimeDescriptionScalarWhereWithAggregatesInput[]
    OR?: OvertimeDescriptionScalarWhereWithAggregatesInput[]
    NOT?: OvertimeDescriptionScalarWhereWithAggregatesInput | OvertimeDescriptionScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"OvertimeDescription"> | number
    overtimeId?: IntWithAggregatesFilter<"OvertimeDescription"> | number
    assignee?: StringWithAggregatesFilter<"OvertimeDescription"> | string
    description?: StringWithAggregatesFilter<"OvertimeDescription"> | string
    duration?: DecimalWithAggregatesFilter<"OvertimeDescription"> | Decimal | DecimalJsLike | number | string
    date?: DateTimeNullableWithAggregatesFilter<"OvertimeDescription"> | Date | string | null
    startDate?: DateTimeNullableWithAggregatesFilter<"OvertimeDescription"> | Date | string | null
    endDate?: DateTimeNullableWithAggregatesFilter<"OvertimeDescription"> | Date | string | null
  }

  export type ApiLogWhereInput = {
    AND?: ApiLogWhereInput | ApiLogWhereInput[]
    OR?: ApiLogWhereInput[]
    NOT?: ApiLogWhereInput | ApiLogWhereInput[]
    id?: BigIntFilter<"ApiLog"> | bigint | number
    service_name?: StringNullableFilter<"ApiLog"> | string | null
    endpoint?: StringNullableFilter<"ApiLog"> | string | null
    url?: StringNullableFilter<"ApiLog"> | string | null
    method?: StringNullableFilter<"ApiLog"> | string | null
    ip_address?: StringNullableFilter<"ApiLog"> | string | null
    user_agent?: StringNullableFilter<"ApiLog"> | string | null
    request_header?: JsonNullableFilter<"ApiLog">
    request_body?: JsonNullableFilter<"ApiLog">
    response_body?: JsonNullableFilter<"ApiLog">
    status_code?: IntNullableFilter<"ApiLog"> | number | null
    is_success?: BoolFilter<"ApiLog"> | boolean
    error_message?: StringNullableFilter<"ApiLog"> | string | null
    request_time?: DateTimeFilter<"ApiLog"> | Date | string
    response_time?: DateTimeNullableFilter<"ApiLog"> | Date | string | null
    duration_ms?: IntNullableFilter<"ApiLog"> | number | null
    trace_id?: StringNullableFilter<"ApiLog"> | string | null
    called_by?: StringNullableFilter<"ApiLog"> | string | null
    created_at?: DateTimeFilter<"ApiLog"> | Date | string
    is_archived?: BoolFilter<"ApiLog"> | boolean
  }

  export type ApiLogOrderByWithRelationInput = {
    id?: SortOrder
    service_name?: SortOrderInput | SortOrder
    endpoint?: SortOrderInput | SortOrder
    url?: SortOrderInput | SortOrder
    method?: SortOrderInput | SortOrder
    ip_address?: SortOrderInput | SortOrder
    user_agent?: SortOrderInput | SortOrder
    request_header?: SortOrderInput | SortOrder
    request_body?: SortOrderInput | SortOrder
    response_body?: SortOrderInput | SortOrder
    status_code?: SortOrderInput | SortOrder
    is_success?: SortOrder
    error_message?: SortOrderInput | SortOrder
    request_time?: SortOrder
    response_time?: SortOrderInput | SortOrder
    duration_ms?: SortOrderInput | SortOrder
    trace_id?: SortOrderInput | SortOrder
    called_by?: SortOrderInput | SortOrder
    created_at?: SortOrder
    is_archived?: SortOrder
  }

  export type ApiLogWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: ApiLogWhereInput | ApiLogWhereInput[]
    OR?: ApiLogWhereInput[]
    NOT?: ApiLogWhereInput | ApiLogWhereInput[]
    service_name?: StringNullableFilter<"ApiLog"> | string | null
    endpoint?: StringNullableFilter<"ApiLog"> | string | null
    url?: StringNullableFilter<"ApiLog"> | string | null
    method?: StringNullableFilter<"ApiLog"> | string | null
    ip_address?: StringNullableFilter<"ApiLog"> | string | null
    user_agent?: StringNullableFilter<"ApiLog"> | string | null
    request_header?: JsonNullableFilter<"ApiLog">
    request_body?: JsonNullableFilter<"ApiLog">
    response_body?: JsonNullableFilter<"ApiLog">
    status_code?: IntNullableFilter<"ApiLog"> | number | null
    is_success?: BoolFilter<"ApiLog"> | boolean
    error_message?: StringNullableFilter<"ApiLog"> | string | null
    request_time?: DateTimeFilter<"ApiLog"> | Date | string
    response_time?: DateTimeNullableFilter<"ApiLog"> | Date | string | null
    duration_ms?: IntNullableFilter<"ApiLog"> | number | null
    trace_id?: StringNullableFilter<"ApiLog"> | string | null
    called_by?: StringNullableFilter<"ApiLog"> | string | null
    created_at?: DateTimeFilter<"ApiLog"> | Date | string
    is_archived?: BoolFilter<"ApiLog"> | boolean
  }, "id">

  export type ApiLogOrderByWithAggregationInput = {
    id?: SortOrder
    service_name?: SortOrderInput | SortOrder
    endpoint?: SortOrderInput | SortOrder
    url?: SortOrderInput | SortOrder
    method?: SortOrderInput | SortOrder
    ip_address?: SortOrderInput | SortOrder
    user_agent?: SortOrderInput | SortOrder
    request_header?: SortOrderInput | SortOrder
    request_body?: SortOrderInput | SortOrder
    response_body?: SortOrderInput | SortOrder
    status_code?: SortOrderInput | SortOrder
    is_success?: SortOrder
    error_message?: SortOrderInput | SortOrder
    request_time?: SortOrder
    response_time?: SortOrderInput | SortOrder
    duration_ms?: SortOrderInput | SortOrder
    trace_id?: SortOrderInput | SortOrder
    called_by?: SortOrderInput | SortOrder
    created_at?: SortOrder
    is_archived?: SortOrder
    _count?: ApiLogCountOrderByAggregateInput
    _avg?: ApiLogAvgOrderByAggregateInput
    _max?: ApiLogMaxOrderByAggregateInput
    _min?: ApiLogMinOrderByAggregateInput
    _sum?: ApiLogSumOrderByAggregateInput
  }

  export type ApiLogScalarWhereWithAggregatesInput = {
    AND?: ApiLogScalarWhereWithAggregatesInput | ApiLogScalarWhereWithAggregatesInput[]
    OR?: ApiLogScalarWhereWithAggregatesInput[]
    NOT?: ApiLogScalarWhereWithAggregatesInput | ApiLogScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"ApiLog"> | bigint | number
    service_name?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    endpoint?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    url?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    method?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    ip_address?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    user_agent?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    request_header?: JsonNullableWithAggregatesFilter<"ApiLog">
    request_body?: JsonNullableWithAggregatesFilter<"ApiLog">
    response_body?: JsonNullableWithAggregatesFilter<"ApiLog">
    status_code?: IntNullableWithAggregatesFilter<"ApiLog"> | number | null
    is_success?: BoolWithAggregatesFilter<"ApiLog"> | boolean
    error_message?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    request_time?: DateTimeWithAggregatesFilter<"ApiLog"> | Date | string
    response_time?: DateTimeNullableWithAggregatesFilter<"ApiLog"> | Date | string | null
    duration_ms?: IntNullableWithAggregatesFilter<"ApiLog"> | number | null
    trace_id?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    called_by?: StringNullableWithAggregatesFilter<"ApiLog"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"ApiLog"> | Date | string
    is_archived?: BoolWithAggregatesFilter<"ApiLog"> | boolean
  }

  export type GroupCreateInput = {
    name_th: string
    name_en?: string | null
    projects?: ProjectCreateNestedManyWithoutGroupInput
  }

  export type GroupUncheckedCreateInput = {
    id?: number
    name_th: string
    name_en?: string | null
    projects?: ProjectUncheckedCreateNestedManyWithoutGroupInput
  }

  export type GroupUpdateInput = {
    name_th?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    projects?: ProjectUpdateManyWithoutGroupNestedInput
  }

  export type GroupUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name_th?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    projects?: ProjectUncheckedUpdateManyWithoutGroupNestedInput
  }

  export type GroupCreateManyInput = {
    id?: number
    name_th: string
    name_en?: string | null
  }

  export type GroupUpdateManyMutationInput = {
    name_th?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GroupUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name_th?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectStatusCreateInput = {
    priority?: number
    nameTh: string
    nameEn?: string | null
    projects?: ProjectCreateNestedManyWithoutProjectStatusInput
    features?: FeatureCreateNestedManyWithoutProjectStatusInput
  }

  export type ProjectStatusUncheckedCreateInput = {
    id?: number
    priority?: number
    nameTh: string
    nameEn?: string | null
    projects?: ProjectUncheckedCreateNestedManyWithoutProjectStatusInput
    features?: FeatureUncheckedCreateNestedManyWithoutProjectStatusInput
  }

  export type ProjectStatusUpdateInput = {
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    projects?: ProjectUpdateManyWithoutProjectStatusNestedInput
    features?: FeatureUpdateManyWithoutProjectStatusNestedInput
  }

  export type ProjectStatusUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    projects?: ProjectUncheckedUpdateManyWithoutProjectStatusNestedInput
    features?: FeatureUncheckedUpdateManyWithoutProjectStatusNestedInput
  }

  export type ProjectStatusCreateManyInput = {
    id?: number
    priority?: number
    nameTh: string
    nameEn?: string | null
  }

  export type ProjectStatusUpdateManyMutationInput = {
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectStatusUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectCreateInput = {
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    group?: GroupCreateNestedOneWithoutProjectsInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutProjectsInput
    features?: FeatureCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    features?: FeatureUncheckedCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    group?: GroupUpdateOneWithoutProjectsNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutProjectsNestedInput
    features?: FeatureUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    features?: FeatureUncheckedUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectCreateManyInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type ProjectUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ProjectUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type FeatureCreateInput = {
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    project: ProjectCreateNestedOneWithoutFeaturesInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutFeaturesInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutFeatureInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutFeatureInput
  }

  export type FeatureUncheckedCreateInput = {
    id?: number
    projectId: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutFeatureInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutFeatureInput
  }

  export type FeatureUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    project?: ProjectUpdateOneRequiredWithoutFeaturesNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutFeaturesNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutFeatureNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutFeatureNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureCreateManyInput = {
    id?: number
    projectId: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type FeatureUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type FeatureUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ProjectAssigneeCreateInput = {
    userId: number
    position?: string | null
    project: ProjectCreateNestedOneWithoutProjectAssigneesInput
    feature?: FeatureCreateNestedOneWithoutProjectAssigneesInput
  }

  export type ProjectAssigneeUncheckedCreateInput = {
    id?: number
    userId: number
    projectId: number
    featureId?: number | null
    position?: string | null
  }

  export type ProjectAssigneeUpdateInput = {
    userId?: IntFieldUpdateOperationsInput | number
    position?: NullableStringFieldUpdateOperationsInput | string | null
    project?: ProjectUpdateOneRequiredWithoutProjectAssigneesNestedInput
    feature?: FeatureUpdateOneWithoutProjectAssigneesNestedInput
  }

  export type ProjectAssigneeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    featureId?: NullableIntFieldUpdateOperationsInput | number | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectAssigneeCreateManyInput = {
    id?: number
    userId: number
    projectId: number
    featureId?: number | null
    position?: string | null
  }

  export type ProjectAssigneeUpdateManyMutationInput = {
    userId?: IntFieldUpdateOperationsInput | number
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectAssigneeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    featureId?: NullableIntFieldUpdateOperationsInput | number | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TimesheetEntryCreateInput = {
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    feature: FeatureCreateNestedOneWithoutTimesheetsInput
    project: ProjectCreateNestedOneWithoutTimesheetsInput
  }

  export type TimesheetEntryUncheckedCreateInput = {
    id?: number
    projectId: number
    featureId: number
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type TimesheetEntryUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    feature?: FeatureUpdateOneRequiredWithoutTimesheetsNestedInput
    project?: ProjectUpdateOneRequiredWithoutTimesheetsNestedInput
  }

  export type TimesheetEntryUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    featureId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimesheetEntryCreateManyInput = {
    id?: number
    projectId: number
    featureId: number
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type TimesheetEntryUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimesheetEntryUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    featureId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type OvertimeCreateInput = {
    requesterId: string
    requestDate: Date | string
    status: string
    isDeleted?: boolean
    createdAt?: Date | string
    createdBy: string
    updatedAt?: Date | string
    updatedBy?: string | null
    descriptions?: OvertimeDescriptionCreateNestedManyWithoutOvertimeInput
  }

  export type OvertimeUncheckedCreateInput = {
    id?: number
    requesterId: string
    requestDate: Date | string
    status: string
    isDeleted?: boolean
    createdAt?: Date | string
    createdBy: string
    updatedAt?: Date | string
    updatedBy?: string | null
    descriptions?: OvertimeDescriptionUncheckedCreateNestedManyWithoutOvertimeInput
  }

  export type OvertimeUpdateInput = {
    requesterId?: StringFieldUpdateOperationsInput | string
    requestDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    descriptions?: OvertimeDescriptionUpdateManyWithoutOvertimeNestedInput
  }

  export type OvertimeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    requesterId?: StringFieldUpdateOperationsInput | string
    requestDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    descriptions?: OvertimeDescriptionUncheckedUpdateManyWithoutOvertimeNestedInput
  }

  export type OvertimeCreateManyInput = {
    id?: number
    requesterId: string
    requestDate: Date | string
    status: string
    isDeleted?: boolean
    createdAt?: Date | string
    createdBy: string
    updatedAt?: Date | string
    updatedBy?: string | null
  }

  export type OvertimeUpdateManyMutationInput = {
    requesterId?: StringFieldUpdateOperationsInput | string
    requestDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OvertimeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    requesterId?: StringFieldUpdateOperationsInput | string
    requestDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OvertimeDescriptionCreateInput = {
    assignee: string
    description: string
    duration: Decimal | DecimalJsLike | number | string
    date?: Date | string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    overtime: OvertimeCreateNestedOneWithoutDescriptionsInput
  }

  export type OvertimeDescriptionUncheckedCreateInput = {
    id?: number
    overtimeId: number
    assignee: string
    description: string
    duration: Decimal | DecimalJsLike | number | string
    date?: Date | string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
  }

  export type OvertimeDescriptionUpdateInput = {
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    overtime?: OvertimeUpdateOneRequiredWithoutDescriptionsNestedInput
  }

  export type OvertimeDescriptionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    overtimeId?: IntFieldUpdateOperationsInput | number
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type OvertimeDescriptionCreateManyInput = {
    id?: number
    overtimeId: number
    assignee: string
    description: string
    duration: Decimal | DecimalJsLike | number | string
    date?: Date | string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
  }

  export type OvertimeDescriptionUpdateManyMutationInput = {
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type OvertimeDescriptionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    overtimeId?: IntFieldUpdateOperationsInput | number
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ApiLogCreateInput = {
    id?: bigint | number
    service_name?: string | null
    endpoint?: string | null
    url?: string | null
    method?: string | null
    ip_address?: string | null
    user_agent?: string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: number | null
    is_success?: boolean
    error_message?: string | null
    request_time: Date | string
    response_time?: Date | string | null
    duration_ms?: number | null
    trace_id?: string | null
    called_by?: string | null
    created_at?: Date | string
    is_archived?: boolean
  }

  export type ApiLogUncheckedCreateInput = {
    id?: bigint | number
    service_name?: string | null
    endpoint?: string | null
    url?: string | null
    method?: string | null
    ip_address?: string | null
    user_agent?: string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: number | null
    is_success?: boolean
    error_message?: string | null
    request_time: Date | string
    response_time?: Date | string | null
    duration_ms?: number | null
    trace_id?: string | null
    called_by?: string | null
    created_at?: Date | string
    is_archived?: boolean
  }

  export type ApiLogUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    service_name?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: NullableIntFieldUpdateOperationsInput | number | null
    is_success?: BoolFieldUpdateOperationsInput | boolean
    error_message?: NullableStringFieldUpdateOperationsInput | string | null
    request_time?: DateTimeFieldUpdateOperationsInput | Date | string
    response_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration_ms?: NullableIntFieldUpdateOperationsInput | number | null
    trace_id?: NullableStringFieldUpdateOperationsInput | string | null
    called_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_archived?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ApiLogUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    service_name?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: NullableIntFieldUpdateOperationsInput | number | null
    is_success?: BoolFieldUpdateOperationsInput | boolean
    error_message?: NullableStringFieldUpdateOperationsInput | string | null
    request_time?: DateTimeFieldUpdateOperationsInput | Date | string
    response_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration_ms?: NullableIntFieldUpdateOperationsInput | number | null
    trace_id?: NullableStringFieldUpdateOperationsInput | string | null
    called_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_archived?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ApiLogCreateManyInput = {
    id?: bigint | number
    service_name?: string | null
    endpoint?: string | null
    url?: string | null
    method?: string | null
    ip_address?: string | null
    user_agent?: string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: number | null
    is_success?: boolean
    error_message?: string | null
    request_time: Date | string
    response_time?: Date | string | null
    duration_ms?: number | null
    trace_id?: string | null
    called_by?: string | null
    created_at?: Date | string
    is_archived?: boolean
  }

  export type ApiLogUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    service_name?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: NullableIntFieldUpdateOperationsInput | number | null
    is_success?: BoolFieldUpdateOperationsInput | boolean
    error_message?: NullableStringFieldUpdateOperationsInput | string | null
    request_time?: DateTimeFieldUpdateOperationsInput | Date | string
    response_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration_ms?: NullableIntFieldUpdateOperationsInput | number | null
    trace_id?: NullableStringFieldUpdateOperationsInput | string | null
    called_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_archived?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ApiLogUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    service_name?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: NullableStringFieldUpdateOperationsInput | string | null
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    request_header?: NullableJsonNullValueInput | InputJsonValue
    request_body?: NullableJsonNullValueInput | InputJsonValue
    response_body?: NullableJsonNullValueInput | InputJsonValue
    status_code?: NullableIntFieldUpdateOperationsInput | number | null
    is_success?: BoolFieldUpdateOperationsInput | boolean
    error_message?: NullableStringFieldUpdateOperationsInput | string | null
    request_time?: DateTimeFieldUpdateOperationsInput | Date | string
    response_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    duration_ms?: NullableIntFieldUpdateOperationsInput | number | null
    trace_id?: NullableStringFieldUpdateOperationsInput | string | null
    called_by?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_archived?: BoolFieldUpdateOperationsInput | boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type ProjectListRelationFilter = {
    every?: ProjectWhereInput
    some?: ProjectWhereInput
    none?: ProjectWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProjectOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GroupCountOrderByAggregateInput = {
    id?: SortOrder
    name_th?: SortOrder
    name_en?: SortOrder
  }

  export type GroupAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type GroupMaxOrderByAggregateInput = {
    id?: SortOrder
    name_th?: SortOrder
    name_en?: SortOrder
  }

  export type GroupMinOrderByAggregateInput = {
    id?: SortOrder
    name_th?: SortOrder
    name_en?: SortOrder
  }

  export type GroupSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type FeatureListRelationFilter = {
    every?: FeatureWhereInput
    some?: FeatureWhereInput
    none?: FeatureWhereInput
  }

  export type FeatureOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProjectStatusCountOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
    nameTh?: SortOrder
    nameEn?: SortOrder
  }

  export type ProjectStatusAvgOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
  }

  export type ProjectStatusMaxOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
    nameTh?: SortOrder
    nameEn?: SortOrder
  }

  export type ProjectStatusMinOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
    nameTh?: SortOrder
    nameEn?: SortOrder
  }

  export type ProjectStatusSumOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type GroupNullableScalarRelationFilter = {
    is?: GroupWhereInput | null
    isNot?: GroupWhereInput | null
  }

  export type ProjectStatusNullableScalarRelationFilter = {
    is?: ProjectStatusWhereInput | null
    isNot?: ProjectStatusWhereInput | null
  }

  export type ProjectAssigneeListRelationFilter = {
    every?: ProjectAssigneeWhereInput
    some?: ProjectAssigneeWhereInput
    none?: ProjectAssigneeWhereInput
  }

  export type TimesheetEntryListRelationFilter = {
    every?: TimesheetEntryWhereInput
    some?: TimesheetEntryWhereInput
    none?: TimesheetEntryWhereInput
  }

  export type ProjectAssigneeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TimesheetEntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProjectCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    name_en?: SortOrder
    description?: SortOrder
    categoryType?: SortOrder
    approval?: SortOrder
    approval_status?: SortOrder
    status?: SortOrder
    start_date?: SortOrder
    end_date?: SortOrder
    completeDate?: SortOrder
    estimateWorkhours?: SortOrder
    group_id?: SortOrder
    projectStatusId?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type ProjectAvgOrderByAggregateInput = {
    id?: SortOrder
    estimateWorkhours?: SortOrder
    group_id?: SortOrder
    projectStatusId?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type ProjectMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    name_en?: SortOrder
    description?: SortOrder
    categoryType?: SortOrder
    approval?: SortOrder
    approval_status?: SortOrder
    status?: SortOrder
    start_date?: SortOrder
    end_date?: SortOrder
    completeDate?: SortOrder
    estimateWorkhours?: SortOrder
    group_id?: SortOrder
    projectStatusId?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type ProjectMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    name_en?: SortOrder
    description?: SortOrder
    categoryType?: SortOrder
    approval?: SortOrder
    approval_status?: SortOrder
    status?: SortOrder
    start_date?: SortOrder
    end_date?: SortOrder
    completeDate?: SortOrder
    estimateWorkhours?: SortOrder
    group_id?: SortOrder
    projectStatusId?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type ProjectSumOrderByAggregateInput = {
    id?: SortOrder
    estimateWorkhours?: SortOrder
    group_id?: SortOrder
    projectStatusId?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumProjectAssetCaptureTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectAssetCaptureType | EnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel> | $Enums.ProjectAssetCaptureType
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ProjectScalarRelationFilter = {
    is?: ProjectWhereInput
    isNot?: ProjectWhereInput
  }

  export type FeatureCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    name?: SortOrder
    name_en?: SortOrder
    status?: SortOrder
    assetCaptureType?: SortOrder
    backlogDescription?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    completeDate?: SortOrder
    estimateWorkhours?: SortOrder
    projectStatusId?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type FeatureAvgOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    estimateWorkhours?: SortOrder
    projectStatusId?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type FeatureMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    name?: SortOrder
    name_en?: SortOrder
    status?: SortOrder
    assetCaptureType?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    completeDate?: SortOrder
    estimateWorkhours?: SortOrder
    projectStatusId?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type FeatureMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    name?: SortOrder
    name_en?: SortOrder
    status?: SortOrder
    assetCaptureType?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    completeDate?: SortOrder
    estimateWorkhours?: SortOrder
    projectStatusId?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type FeatureSumOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    estimateWorkhours?: SortOrder
    projectStatusId?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type EnumProjectAssetCaptureTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectAssetCaptureType | EnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProjectAssetCaptureTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProjectAssetCaptureType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel>
    _max?: NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type FeatureNullableScalarRelationFilter = {
    is?: FeatureWhereInput | null
    isNot?: FeatureWhereInput | null
  }

  export type ProjectAssigneeCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    position?: SortOrder
  }

  export type ProjectAssigneeAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
  }

  export type ProjectAssigneeMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    position?: SortOrder
  }

  export type ProjectAssigneeMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    position?: SortOrder
  }

  export type ProjectAssigneeSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type FeatureScalarRelationFilter = {
    is?: FeatureWhereInput
    isNot?: FeatureWhereInput
  }

  export type TimesheetEntryCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    date?: SortOrder
    hours?: SortOrder
    description?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type TimesheetEntryAvgOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    hours?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type TimesheetEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    date?: SortOrder
    hours?: SortOrder
    description?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type TimesheetEntryMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    date?: SortOrder
    hours?: SortOrder
    description?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type TimesheetEntrySumOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    featureId?: SortOrder
    hours?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type OvertimeDescriptionListRelationFilter = {
    every?: OvertimeDescriptionWhereInput
    some?: OvertimeDescriptionWhereInput
    none?: OvertimeDescriptionWhereInput
  }

  export type OvertimeDescriptionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OvertimeCountOrderByAggregateInput = {
    id?: SortOrder
    requesterId?: SortOrder
    requestDate?: SortOrder
    status?: SortOrder
    isDeleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type OvertimeAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type OvertimeMaxOrderByAggregateInput = {
    id?: SortOrder
    requesterId?: SortOrder
    requestDate?: SortOrder
    status?: SortOrder
    isDeleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type OvertimeMinOrderByAggregateInput = {
    id?: SortOrder
    requesterId?: SortOrder
    requestDate?: SortOrder
    status?: SortOrder
    isDeleted?: SortOrder
    createdAt?: SortOrder
    createdBy?: SortOrder
    updatedAt?: SortOrder
    updatedBy?: SortOrder
  }

  export type OvertimeSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type OvertimeScalarRelationFilter = {
    is?: OvertimeWhereInput
    isNot?: OvertimeWhereInput
  }

  export type OvertimeDescriptionCountOrderByAggregateInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    assignee?: SortOrder
    description?: SortOrder
    duration?: SortOrder
    date?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
  }

  export type OvertimeDescriptionAvgOrderByAggregateInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    duration?: SortOrder
  }

  export type OvertimeDescriptionMaxOrderByAggregateInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    assignee?: SortOrder
    description?: SortOrder
    duration?: SortOrder
    date?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
  }

  export type OvertimeDescriptionMinOrderByAggregateInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    assignee?: SortOrder
    description?: SortOrder
    duration?: SortOrder
    date?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
  }

  export type OvertimeDescriptionSumOrderByAggregateInput = {
    id?: SortOrder
    overtimeId?: SortOrder
    duration?: SortOrder
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type ApiLogCountOrderByAggregateInput = {
    id?: SortOrder
    service_name?: SortOrder
    endpoint?: SortOrder
    url?: SortOrder
    method?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    request_header?: SortOrder
    request_body?: SortOrder
    response_body?: SortOrder
    status_code?: SortOrder
    is_success?: SortOrder
    error_message?: SortOrder
    request_time?: SortOrder
    response_time?: SortOrder
    duration_ms?: SortOrder
    trace_id?: SortOrder
    called_by?: SortOrder
    created_at?: SortOrder
    is_archived?: SortOrder
  }

  export type ApiLogAvgOrderByAggregateInput = {
    id?: SortOrder
    status_code?: SortOrder
    duration_ms?: SortOrder
  }

  export type ApiLogMaxOrderByAggregateInput = {
    id?: SortOrder
    service_name?: SortOrder
    endpoint?: SortOrder
    url?: SortOrder
    method?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    status_code?: SortOrder
    is_success?: SortOrder
    error_message?: SortOrder
    request_time?: SortOrder
    response_time?: SortOrder
    duration_ms?: SortOrder
    trace_id?: SortOrder
    called_by?: SortOrder
    created_at?: SortOrder
    is_archived?: SortOrder
  }

  export type ApiLogMinOrderByAggregateInput = {
    id?: SortOrder
    service_name?: SortOrder
    endpoint?: SortOrder
    url?: SortOrder
    method?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    status_code?: SortOrder
    is_success?: SortOrder
    error_message?: SortOrder
    request_time?: SortOrder
    response_time?: SortOrder
    duration_ms?: SortOrder
    trace_id?: SortOrder
    called_by?: SortOrder
    created_at?: SortOrder
    is_archived?: SortOrder
  }

  export type ApiLogSumOrderByAggregateInput = {
    id?: SortOrder
    status_code?: SortOrder
    duration_ms?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type ProjectCreateNestedManyWithoutGroupInput = {
    create?: XOR<ProjectCreateWithoutGroupInput, ProjectUncheckedCreateWithoutGroupInput> | ProjectCreateWithoutGroupInput[] | ProjectUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutGroupInput | ProjectCreateOrConnectWithoutGroupInput[]
    createMany?: ProjectCreateManyGroupInputEnvelope
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
  }

  export type ProjectUncheckedCreateNestedManyWithoutGroupInput = {
    create?: XOR<ProjectCreateWithoutGroupInput, ProjectUncheckedCreateWithoutGroupInput> | ProjectCreateWithoutGroupInput[] | ProjectUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutGroupInput | ProjectCreateOrConnectWithoutGroupInput[]
    createMany?: ProjectCreateManyGroupInputEnvelope
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ProjectUpdateManyWithoutGroupNestedInput = {
    create?: XOR<ProjectCreateWithoutGroupInput, ProjectUncheckedCreateWithoutGroupInput> | ProjectCreateWithoutGroupInput[] | ProjectUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutGroupInput | ProjectCreateOrConnectWithoutGroupInput[]
    upsert?: ProjectUpsertWithWhereUniqueWithoutGroupInput | ProjectUpsertWithWhereUniqueWithoutGroupInput[]
    createMany?: ProjectCreateManyGroupInputEnvelope
    set?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    disconnect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    delete?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    update?: ProjectUpdateWithWhereUniqueWithoutGroupInput | ProjectUpdateWithWhereUniqueWithoutGroupInput[]
    updateMany?: ProjectUpdateManyWithWhereWithoutGroupInput | ProjectUpdateManyWithWhereWithoutGroupInput[]
    deleteMany?: ProjectScalarWhereInput | ProjectScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ProjectUncheckedUpdateManyWithoutGroupNestedInput = {
    create?: XOR<ProjectCreateWithoutGroupInput, ProjectUncheckedCreateWithoutGroupInput> | ProjectCreateWithoutGroupInput[] | ProjectUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutGroupInput | ProjectCreateOrConnectWithoutGroupInput[]
    upsert?: ProjectUpsertWithWhereUniqueWithoutGroupInput | ProjectUpsertWithWhereUniqueWithoutGroupInput[]
    createMany?: ProjectCreateManyGroupInputEnvelope
    set?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    disconnect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    delete?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    update?: ProjectUpdateWithWhereUniqueWithoutGroupInput | ProjectUpdateWithWhereUniqueWithoutGroupInput[]
    updateMany?: ProjectUpdateManyWithWhereWithoutGroupInput | ProjectUpdateManyWithWhereWithoutGroupInput[]
    deleteMany?: ProjectScalarWhereInput | ProjectScalarWhereInput[]
  }

  export type ProjectCreateNestedManyWithoutProjectStatusInput = {
    create?: XOR<ProjectCreateWithoutProjectStatusInput, ProjectUncheckedCreateWithoutProjectStatusInput> | ProjectCreateWithoutProjectStatusInput[] | ProjectUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutProjectStatusInput | ProjectCreateOrConnectWithoutProjectStatusInput[]
    createMany?: ProjectCreateManyProjectStatusInputEnvelope
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
  }

  export type FeatureCreateNestedManyWithoutProjectStatusInput = {
    create?: XOR<FeatureCreateWithoutProjectStatusInput, FeatureUncheckedCreateWithoutProjectStatusInput> | FeatureCreateWithoutProjectStatusInput[] | FeatureUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectStatusInput | FeatureCreateOrConnectWithoutProjectStatusInput[]
    createMany?: FeatureCreateManyProjectStatusInputEnvelope
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
  }

  export type ProjectUncheckedCreateNestedManyWithoutProjectStatusInput = {
    create?: XOR<ProjectCreateWithoutProjectStatusInput, ProjectUncheckedCreateWithoutProjectStatusInput> | ProjectCreateWithoutProjectStatusInput[] | ProjectUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutProjectStatusInput | ProjectCreateOrConnectWithoutProjectStatusInput[]
    createMany?: ProjectCreateManyProjectStatusInputEnvelope
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
  }

  export type FeatureUncheckedCreateNestedManyWithoutProjectStatusInput = {
    create?: XOR<FeatureCreateWithoutProjectStatusInput, FeatureUncheckedCreateWithoutProjectStatusInput> | FeatureCreateWithoutProjectStatusInput[] | FeatureUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectStatusInput | FeatureCreateOrConnectWithoutProjectStatusInput[]
    createMany?: FeatureCreateManyProjectStatusInputEnvelope
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
  }

  export type ProjectUpdateManyWithoutProjectStatusNestedInput = {
    create?: XOR<ProjectCreateWithoutProjectStatusInput, ProjectUncheckedCreateWithoutProjectStatusInput> | ProjectCreateWithoutProjectStatusInput[] | ProjectUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutProjectStatusInput | ProjectCreateOrConnectWithoutProjectStatusInput[]
    upsert?: ProjectUpsertWithWhereUniqueWithoutProjectStatusInput | ProjectUpsertWithWhereUniqueWithoutProjectStatusInput[]
    createMany?: ProjectCreateManyProjectStatusInputEnvelope
    set?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    disconnect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    delete?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    update?: ProjectUpdateWithWhereUniqueWithoutProjectStatusInput | ProjectUpdateWithWhereUniqueWithoutProjectStatusInput[]
    updateMany?: ProjectUpdateManyWithWhereWithoutProjectStatusInput | ProjectUpdateManyWithWhereWithoutProjectStatusInput[]
    deleteMany?: ProjectScalarWhereInput | ProjectScalarWhereInput[]
  }

  export type FeatureUpdateManyWithoutProjectStatusNestedInput = {
    create?: XOR<FeatureCreateWithoutProjectStatusInput, FeatureUncheckedCreateWithoutProjectStatusInput> | FeatureCreateWithoutProjectStatusInput[] | FeatureUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectStatusInput | FeatureCreateOrConnectWithoutProjectStatusInput[]
    upsert?: FeatureUpsertWithWhereUniqueWithoutProjectStatusInput | FeatureUpsertWithWhereUniqueWithoutProjectStatusInput[]
    createMany?: FeatureCreateManyProjectStatusInputEnvelope
    set?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    disconnect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    delete?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    update?: FeatureUpdateWithWhereUniqueWithoutProjectStatusInput | FeatureUpdateWithWhereUniqueWithoutProjectStatusInput[]
    updateMany?: FeatureUpdateManyWithWhereWithoutProjectStatusInput | FeatureUpdateManyWithWhereWithoutProjectStatusInput[]
    deleteMany?: FeatureScalarWhereInput | FeatureScalarWhereInput[]
  }

  export type ProjectUncheckedUpdateManyWithoutProjectStatusNestedInput = {
    create?: XOR<ProjectCreateWithoutProjectStatusInput, ProjectUncheckedCreateWithoutProjectStatusInput> | ProjectCreateWithoutProjectStatusInput[] | ProjectUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: ProjectCreateOrConnectWithoutProjectStatusInput | ProjectCreateOrConnectWithoutProjectStatusInput[]
    upsert?: ProjectUpsertWithWhereUniqueWithoutProjectStatusInput | ProjectUpsertWithWhereUniqueWithoutProjectStatusInput[]
    createMany?: ProjectCreateManyProjectStatusInputEnvelope
    set?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    disconnect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    delete?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    connect?: ProjectWhereUniqueInput | ProjectWhereUniqueInput[]
    update?: ProjectUpdateWithWhereUniqueWithoutProjectStatusInput | ProjectUpdateWithWhereUniqueWithoutProjectStatusInput[]
    updateMany?: ProjectUpdateManyWithWhereWithoutProjectStatusInput | ProjectUpdateManyWithWhereWithoutProjectStatusInput[]
    deleteMany?: ProjectScalarWhereInput | ProjectScalarWhereInput[]
  }

  export type FeatureUncheckedUpdateManyWithoutProjectStatusNestedInput = {
    create?: XOR<FeatureCreateWithoutProjectStatusInput, FeatureUncheckedCreateWithoutProjectStatusInput> | FeatureCreateWithoutProjectStatusInput[] | FeatureUncheckedCreateWithoutProjectStatusInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectStatusInput | FeatureCreateOrConnectWithoutProjectStatusInput[]
    upsert?: FeatureUpsertWithWhereUniqueWithoutProjectStatusInput | FeatureUpsertWithWhereUniqueWithoutProjectStatusInput[]
    createMany?: FeatureCreateManyProjectStatusInputEnvelope
    set?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    disconnect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    delete?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    update?: FeatureUpdateWithWhereUniqueWithoutProjectStatusInput | FeatureUpdateWithWhereUniqueWithoutProjectStatusInput[]
    updateMany?: FeatureUpdateManyWithWhereWithoutProjectStatusInput | FeatureUpdateManyWithWhereWithoutProjectStatusInput[]
    deleteMany?: FeatureScalarWhereInput | FeatureScalarWhereInput[]
  }

  export type GroupCreateNestedOneWithoutProjectsInput = {
    create?: XOR<GroupCreateWithoutProjectsInput, GroupUncheckedCreateWithoutProjectsInput>
    connectOrCreate?: GroupCreateOrConnectWithoutProjectsInput
    connect?: GroupWhereUniqueInput
  }

  export type ProjectStatusCreateNestedOneWithoutProjectsInput = {
    create?: XOR<ProjectStatusCreateWithoutProjectsInput, ProjectStatusUncheckedCreateWithoutProjectsInput>
    connectOrCreate?: ProjectStatusCreateOrConnectWithoutProjectsInput
    connect?: ProjectStatusWhereUniqueInput
  }

  export type FeatureCreateNestedManyWithoutProjectInput = {
    create?: XOR<FeatureCreateWithoutProjectInput, FeatureUncheckedCreateWithoutProjectInput> | FeatureCreateWithoutProjectInput[] | FeatureUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectInput | FeatureCreateOrConnectWithoutProjectInput[]
    createMany?: FeatureCreateManyProjectInputEnvelope
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
  }

  export type ProjectAssigneeCreateNestedManyWithoutProjectInput = {
    create?: XOR<ProjectAssigneeCreateWithoutProjectInput, ProjectAssigneeUncheckedCreateWithoutProjectInput> | ProjectAssigneeCreateWithoutProjectInput[] | ProjectAssigneeUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutProjectInput | ProjectAssigneeCreateOrConnectWithoutProjectInput[]
    createMany?: ProjectAssigneeCreateManyProjectInputEnvelope
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
  }

  export type TimesheetEntryCreateNestedManyWithoutProjectInput = {
    create?: XOR<TimesheetEntryCreateWithoutProjectInput, TimesheetEntryUncheckedCreateWithoutProjectInput> | TimesheetEntryCreateWithoutProjectInput[] | TimesheetEntryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutProjectInput | TimesheetEntryCreateOrConnectWithoutProjectInput[]
    createMany?: TimesheetEntryCreateManyProjectInputEnvelope
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
  }

  export type FeatureUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<FeatureCreateWithoutProjectInput, FeatureUncheckedCreateWithoutProjectInput> | FeatureCreateWithoutProjectInput[] | FeatureUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectInput | FeatureCreateOrConnectWithoutProjectInput[]
    createMany?: FeatureCreateManyProjectInputEnvelope
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
  }

  export type ProjectAssigneeUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<ProjectAssigneeCreateWithoutProjectInput, ProjectAssigneeUncheckedCreateWithoutProjectInput> | ProjectAssigneeCreateWithoutProjectInput[] | ProjectAssigneeUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutProjectInput | ProjectAssigneeCreateOrConnectWithoutProjectInput[]
    createMany?: ProjectAssigneeCreateManyProjectInputEnvelope
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
  }

  export type TimesheetEntryUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<TimesheetEntryCreateWithoutProjectInput, TimesheetEntryUncheckedCreateWithoutProjectInput> | TimesheetEntryCreateWithoutProjectInput[] | TimesheetEntryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutProjectInput | TimesheetEntryCreateOrConnectWithoutProjectInput[]
    createMany?: TimesheetEntryCreateManyProjectInputEnvelope
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type GroupUpdateOneWithoutProjectsNestedInput = {
    create?: XOR<GroupCreateWithoutProjectsInput, GroupUncheckedCreateWithoutProjectsInput>
    connectOrCreate?: GroupCreateOrConnectWithoutProjectsInput
    upsert?: GroupUpsertWithoutProjectsInput
    disconnect?: GroupWhereInput | boolean
    delete?: GroupWhereInput | boolean
    connect?: GroupWhereUniqueInput
    update?: XOR<XOR<GroupUpdateToOneWithWhereWithoutProjectsInput, GroupUpdateWithoutProjectsInput>, GroupUncheckedUpdateWithoutProjectsInput>
  }

  export type ProjectStatusUpdateOneWithoutProjectsNestedInput = {
    create?: XOR<ProjectStatusCreateWithoutProjectsInput, ProjectStatusUncheckedCreateWithoutProjectsInput>
    connectOrCreate?: ProjectStatusCreateOrConnectWithoutProjectsInput
    upsert?: ProjectStatusUpsertWithoutProjectsInput
    disconnect?: ProjectStatusWhereInput | boolean
    delete?: ProjectStatusWhereInput | boolean
    connect?: ProjectStatusWhereUniqueInput
    update?: XOR<XOR<ProjectStatusUpdateToOneWithWhereWithoutProjectsInput, ProjectStatusUpdateWithoutProjectsInput>, ProjectStatusUncheckedUpdateWithoutProjectsInput>
  }

  export type FeatureUpdateManyWithoutProjectNestedInput = {
    create?: XOR<FeatureCreateWithoutProjectInput, FeatureUncheckedCreateWithoutProjectInput> | FeatureCreateWithoutProjectInput[] | FeatureUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectInput | FeatureCreateOrConnectWithoutProjectInput[]
    upsert?: FeatureUpsertWithWhereUniqueWithoutProjectInput | FeatureUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: FeatureCreateManyProjectInputEnvelope
    set?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    disconnect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    delete?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    update?: FeatureUpdateWithWhereUniqueWithoutProjectInput | FeatureUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: FeatureUpdateManyWithWhereWithoutProjectInput | FeatureUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: FeatureScalarWhereInput | FeatureScalarWhereInput[]
  }

  export type ProjectAssigneeUpdateManyWithoutProjectNestedInput = {
    create?: XOR<ProjectAssigneeCreateWithoutProjectInput, ProjectAssigneeUncheckedCreateWithoutProjectInput> | ProjectAssigneeCreateWithoutProjectInput[] | ProjectAssigneeUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutProjectInput | ProjectAssigneeCreateOrConnectWithoutProjectInput[]
    upsert?: ProjectAssigneeUpsertWithWhereUniqueWithoutProjectInput | ProjectAssigneeUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: ProjectAssigneeCreateManyProjectInputEnvelope
    set?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    disconnect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    delete?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    update?: ProjectAssigneeUpdateWithWhereUniqueWithoutProjectInput | ProjectAssigneeUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: ProjectAssigneeUpdateManyWithWhereWithoutProjectInput | ProjectAssigneeUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: ProjectAssigneeScalarWhereInput | ProjectAssigneeScalarWhereInput[]
  }

  export type TimesheetEntryUpdateManyWithoutProjectNestedInput = {
    create?: XOR<TimesheetEntryCreateWithoutProjectInput, TimesheetEntryUncheckedCreateWithoutProjectInput> | TimesheetEntryCreateWithoutProjectInput[] | TimesheetEntryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutProjectInput | TimesheetEntryCreateOrConnectWithoutProjectInput[]
    upsert?: TimesheetEntryUpsertWithWhereUniqueWithoutProjectInput | TimesheetEntryUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: TimesheetEntryCreateManyProjectInputEnvelope
    set?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    disconnect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    delete?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    update?: TimesheetEntryUpdateWithWhereUniqueWithoutProjectInput | TimesheetEntryUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: TimesheetEntryUpdateManyWithWhereWithoutProjectInput | TimesheetEntryUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: TimesheetEntryScalarWhereInput | TimesheetEntryScalarWhereInput[]
  }

  export type FeatureUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<FeatureCreateWithoutProjectInput, FeatureUncheckedCreateWithoutProjectInput> | FeatureCreateWithoutProjectInput[] | FeatureUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectInput | FeatureCreateOrConnectWithoutProjectInput[]
    upsert?: FeatureUpsertWithWhereUniqueWithoutProjectInput | FeatureUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: FeatureCreateManyProjectInputEnvelope
    set?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    disconnect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    delete?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    connect?: FeatureWhereUniqueInput | FeatureWhereUniqueInput[]
    update?: FeatureUpdateWithWhereUniqueWithoutProjectInput | FeatureUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: FeatureUpdateManyWithWhereWithoutProjectInput | FeatureUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: FeatureScalarWhereInput | FeatureScalarWhereInput[]
  }

  export type ProjectAssigneeUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<ProjectAssigneeCreateWithoutProjectInput, ProjectAssigneeUncheckedCreateWithoutProjectInput> | ProjectAssigneeCreateWithoutProjectInput[] | ProjectAssigneeUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutProjectInput | ProjectAssigneeCreateOrConnectWithoutProjectInput[]
    upsert?: ProjectAssigneeUpsertWithWhereUniqueWithoutProjectInput | ProjectAssigneeUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: ProjectAssigneeCreateManyProjectInputEnvelope
    set?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    disconnect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    delete?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    update?: ProjectAssigneeUpdateWithWhereUniqueWithoutProjectInput | ProjectAssigneeUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: ProjectAssigneeUpdateManyWithWhereWithoutProjectInput | ProjectAssigneeUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: ProjectAssigneeScalarWhereInput | ProjectAssigneeScalarWhereInput[]
  }

  export type TimesheetEntryUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<TimesheetEntryCreateWithoutProjectInput, TimesheetEntryUncheckedCreateWithoutProjectInput> | TimesheetEntryCreateWithoutProjectInput[] | TimesheetEntryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutProjectInput | TimesheetEntryCreateOrConnectWithoutProjectInput[]
    upsert?: TimesheetEntryUpsertWithWhereUniqueWithoutProjectInput | TimesheetEntryUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: TimesheetEntryCreateManyProjectInputEnvelope
    set?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    disconnect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    delete?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    update?: TimesheetEntryUpdateWithWhereUniqueWithoutProjectInput | TimesheetEntryUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: TimesheetEntryUpdateManyWithWhereWithoutProjectInput | TimesheetEntryUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: TimesheetEntryScalarWhereInput | TimesheetEntryScalarWhereInput[]
  }

  export type ProjectCreateNestedOneWithoutFeaturesInput = {
    create?: XOR<ProjectCreateWithoutFeaturesInput, ProjectUncheckedCreateWithoutFeaturesInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutFeaturesInput
    connect?: ProjectWhereUniqueInput
  }

  export type ProjectStatusCreateNestedOneWithoutFeaturesInput = {
    create?: XOR<ProjectStatusCreateWithoutFeaturesInput, ProjectStatusUncheckedCreateWithoutFeaturesInput>
    connectOrCreate?: ProjectStatusCreateOrConnectWithoutFeaturesInput
    connect?: ProjectStatusWhereUniqueInput
  }

  export type ProjectAssigneeCreateNestedManyWithoutFeatureInput = {
    create?: XOR<ProjectAssigneeCreateWithoutFeatureInput, ProjectAssigneeUncheckedCreateWithoutFeatureInput> | ProjectAssigneeCreateWithoutFeatureInput[] | ProjectAssigneeUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutFeatureInput | ProjectAssigneeCreateOrConnectWithoutFeatureInput[]
    createMany?: ProjectAssigneeCreateManyFeatureInputEnvelope
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
  }

  export type TimesheetEntryCreateNestedManyWithoutFeatureInput = {
    create?: XOR<TimesheetEntryCreateWithoutFeatureInput, TimesheetEntryUncheckedCreateWithoutFeatureInput> | TimesheetEntryCreateWithoutFeatureInput[] | TimesheetEntryUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutFeatureInput | TimesheetEntryCreateOrConnectWithoutFeatureInput[]
    createMany?: TimesheetEntryCreateManyFeatureInputEnvelope
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
  }

  export type ProjectAssigneeUncheckedCreateNestedManyWithoutFeatureInput = {
    create?: XOR<ProjectAssigneeCreateWithoutFeatureInput, ProjectAssigneeUncheckedCreateWithoutFeatureInput> | ProjectAssigneeCreateWithoutFeatureInput[] | ProjectAssigneeUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutFeatureInput | ProjectAssigneeCreateOrConnectWithoutFeatureInput[]
    createMany?: ProjectAssigneeCreateManyFeatureInputEnvelope
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
  }

  export type TimesheetEntryUncheckedCreateNestedManyWithoutFeatureInput = {
    create?: XOR<TimesheetEntryCreateWithoutFeatureInput, TimesheetEntryUncheckedCreateWithoutFeatureInput> | TimesheetEntryCreateWithoutFeatureInput[] | TimesheetEntryUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutFeatureInput | TimesheetEntryCreateOrConnectWithoutFeatureInput[]
    createMany?: TimesheetEntryCreateManyFeatureInputEnvelope
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
  }

  export type EnumProjectAssetCaptureTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProjectAssetCaptureType
  }

  export type ProjectUpdateOneRequiredWithoutFeaturesNestedInput = {
    create?: XOR<ProjectCreateWithoutFeaturesInput, ProjectUncheckedCreateWithoutFeaturesInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutFeaturesInput
    upsert?: ProjectUpsertWithoutFeaturesInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutFeaturesInput, ProjectUpdateWithoutFeaturesInput>, ProjectUncheckedUpdateWithoutFeaturesInput>
  }

  export type ProjectStatusUpdateOneWithoutFeaturesNestedInput = {
    create?: XOR<ProjectStatusCreateWithoutFeaturesInput, ProjectStatusUncheckedCreateWithoutFeaturesInput>
    connectOrCreate?: ProjectStatusCreateOrConnectWithoutFeaturesInput
    upsert?: ProjectStatusUpsertWithoutFeaturesInput
    disconnect?: ProjectStatusWhereInput | boolean
    delete?: ProjectStatusWhereInput | boolean
    connect?: ProjectStatusWhereUniqueInput
    update?: XOR<XOR<ProjectStatusUpdateToOneWithWhereWithoutFeaturesInput, ProjectStatusUpdateWithoutFeaturesInput>, ProjectStatusUncheckedUpdateWithoutFeaturesInput>
  }

  export type ProjectAssigneeUpdateManyWithoutFeatureNestedInput = {
    create?: XOR<ProjectAssigneeCreateWithoutFeatureInput, ProjectAssigneeUncheckedCreateWithoutFeatureInput> | ProjectAssigneeCreateWithoutFeatureInput[] | ProjectAssigneeUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutFeatureInput | ProjectAssigneeCreateOrConnectWithoutFeatureInput[]
    upsert?: ProjectAssigneeUpsertWithWhereUniqueWithoutFeatureInput | ProjectAssigneeUpsertWithWhereUniqueWithoutFeatureInput[]
    createMany?: ProjectAssigneeCreateManyFeatureInputEnvelope
    set?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    disconnect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    delete?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    update?: ProjectAssigneeUpdateWithWhereUniqueWithoutFeatureInput | ProjectAssigneeUpdateWithWhereUniqueWithoutFeatureInput[]
    updateMany?: ProjectAssigneeUpdateManyWithWhereWithoutFeatureInput | ProjectAssigneeUpdateManyWithWhereWithoutFeatureInput[]
    deleteMany?: ProjectAssigneeScalarWhereInput | ProjectAssigneeScalarWhereInput[]
  }

  export type TimesheetEntryUpdateManyWithoutFeatureNestedInput = {
    create?: XOR<TimesheetEntryCreateWithoutFeatureInput, TimesheetEntryUncheckedCreateWithoutFeatureInput> | TimesheetEntryCreateWithoutFeatureInput[] | TimesheetEntryUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutFeatureInput | TimesheetEntryCreateOrConnectWithoutFeatureInput[]
    upsert?: TimesheetEntryUpsertWithWhereUniqueWithoutFeatureInput | TimesheetEntryUpsertWithWhereUniqueWithoutFeatureInput[]
    createMany?: TimesheetEntryCreateManyFeatureInputEnvelope
    set?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    disconnect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    delete?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    update?: TimesheetEntryUpdateWithWhereUniqueWithoutFeatureInput | TimesheetEntryUpdateWithWhereUniqueWithoutFeatureInput[]
    updateMany?: TimesheetEntryUpdateManyWithWhereWithoutFeatureInput | TimesheetEntryUpdateManyWithWhereWithoutFeatureInput[]
    deleteMany?: TimesheetEntryScalarWhereInput | TimesheetEntryScalarWhereInput[]
  }

  export type ProjectAssigneeUncheckedUpdateManyWithoutFeatureNestedInput = {
    create?: XOR<ProjectAssigneeCreateWithoutFeatureInput, ProjectAssigneeUncheckedCreateWithoutFeatureInput> | ProjectAssigneeCreateWithoutFeatureInput[] | ProjectAssigneeUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: ProjectAssigneeCreateOrConnectWithoutFeatureInput | ProjectAssigneeCreateOrConnectWithoutFeatureInput[]
    upsert?: ProjectAssigneeUpsertWithWhereUniqueWithoutFeatureInput | ProjectAssigneeUpsertWithWhereUniqueWithoutFeatureInput[]
    createMany?: ProjectAssigneeCreateManyFeatureInputEnvelope
    set?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    disconnect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    delete?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    connect?: ProjectAssigneeWhereUniqueInput | ProjectAssigneeWhereUniqueInput[]
    update?: ProjectAssigneeUpdateWithWhereUniqueWithoutFeatureInput | ProjectAssigneeUpdateWithWhereUniqueWithoutFeatureInput[]
    updateMany?: ProjectAssigneeUpdateManyWithWhereWithoutFeatureInput | ProjectAssigneeUpdateManyWithWhereWithoutFeatureInput[]
    deleteMany?: ProjectAssigneeScalarWhereInput | ProjectAssigneeScalarWhereInput[]
  }

  export type TimesheetEntryUncheckedUpdateManyWithoutFeatureNestedInput = {
    create?: XOR<TimesheetEntryCreateWithoutFeatureInput, TimesheetEntryUncheckedCreateWithoutFeatureInput> | TimesheetEntryCreateWithoutFeatureInput[] | TimesheetEntryUncheckedCreateWithoutFeatureInput[]
    connectOrCreate?: TimesheetEntryCreateOrConnectWithoutFeatureInput | TimesheetEntryCreateOrConnectWithoutFeatureInput[]
    upsert?: TimesheetEntryUpsertWithWhereUniqueWithoutFeatureInput | TimesheetEntryUpsertWithWhereUniqueWithoutFeatureInput[]
    createMany?: TimesheetEntryCreateManyFeatureInputEnvelope
    set?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    disconnect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    delete?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    connect?: TimesheetEntryWhereUniqueInput | TimesheetEntryWhereUniqueInput[]
    update?: TimesheetEntryUpdateWithWhereUniqueWithoutFeatureInput | TimesheetEntryUpdateWithWhereUniqueWithoutFeatureInput[]
    updateMany?: TimesheetEntryUpdateManyWithWhereWithoutFeatureInput | TimesheetEntryUpdateManyWithWhereWithoutFeatureInput[]
    deleteMany?: TimesheetEntryScalarWhereInput | TimesheetEntryScalarWhereInput[]
  }

  export type ProjectCreateNestedOneWithoutProjectAssigneesInput = {
    create?: XOR<ProjectCreateWithoutProjectAssigneesInput, ProjectUncheckedCreateWithoutProjectAssigneesInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutProjectAssigneesInput
    connect?: ProjectWhereUniqueInput
  }

  export type FeatureCreateNestedOneWithoutProjectAssigneesInput = {
    create?: XOR<FeatureCreateWithoutProjectAssigneesInput, FeatureUncheckedCreateWithoutProjectAssigneesInput>
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectAssigneesInput
    connect?: FeatureWhereUniqueInput
  }

  export type ProjectUpdateOneRequiredWithoutProjectAssigneesNestedInput = {
    create?: XOR<ProjectCreateWithoutProjectAssigneesInput, ProjectUncheckedCreateWithoutProjectAssigneesInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutProjectAssigneesInput
    upsert?: ProjectUpsertWithoutProjectAssigneesInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutProjectAssigneesInput, ProjectUpdateWithoutProjectAssigneesInput>, ProjectUncheckedUpdateWithoutProjectAssigneesInput>
  }

  export type FeatureUpdateOneWithoutProjectAssigneesNestedInput = {
    create?: XOR<FeatureCreateWithoutProjectAssigneesInput, FeatureUncheckedCreateWithoutProjectAssigneesInput>
    connectOrCreate?: FeatureCreateOrConnectWithoutProjectAssigneesInput
    upsert?: FeatureUpsertWithoutProjectAssigneesInput
    disconnect?: FeatureWhereInput | boolean
    delete?: FeatureWhereInput | boolean
    connect?: FeatureWhereUniqueInput
    update?: XOR<XOR<FeatureUpdateToOneWithWhereWithoutProjectAssigneesInput, FeatureUpdateWithoutProjectAssigneesInput>, FeatureUncheckedUpdateWithoutProjectAssigneesInput>
  }

  export type FeatureCreateNestedOneWithoutTimesheetsInput = {
    create?: XOR<FeatureCreateWithoutTimesheetsInput, FeatureUncheckedCreateWithoutTimesheetsInput>
    connectOrCreate?: FeatureCreateOrConnectWithoutTimesheetsInput
    connect?: FeatureWhereUniqueInput
  }

  export type ProjectCreateNestedOneWithoutTimesheetsInput = {
    create?: XOR<ProjectCreateWithoutTimesheetsInput, ProjectUncheckedCreateWithoutTimesheetsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutTimesheetsInput
    connect?: ProjectWhereUniqueInput
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type FeatureUpdateOneRequiredWithoutTimesheetsNestedInput = {
    create?: XOR<FeatureCreateWithoutTimesheetsInput, FeatureUncheckedCreateWithoutTimesheetsInput>
    connectOrCreate?: FeatureCreateOrConnectWithoutTimesheetsInput
    upsert?: FeatureUpsertWithoutTimesheetsInput
    connect?: FeatureWhereUniqueInput
    update?: XOR<XOR<FeatureUpdateToOneWithWhereWithoutTimesheetsInput, FeatureUpdateWithoutTimesheetsInput>, FeatureUncheckedUpdateWithoutTimesheetsInput>
  }

  export type ProjectUpdateOneRequiredWithoutTimesheetsNestedInput = {
    create?: XOR<ProjectCreateWithoutTimesheetsInput, ProjectUncheckedCreateWithoutTimesheetsInput>
    connectOrCreate?: ProjectCreateOrConnectWithoutTimesheetsInput
    upsert?: ProjectUpsertWithoutTimesheetsInput
    connect?: ProjectWhereUniqueInput
    update?: XOR<XOR<ProjectUpdateToOneWithWhereWithoutTimesheetsInput, ProjectUpdateWithoutTimesheetsInput>, ProjectUncheckedUpdateWithoutTimesheetsInput>
  }

  export type OvertimeDescriptionCreateNestedManyWithoutOvertimeInput = {
    create?: XOR<OvertimeDescriptionCreateWithoutOvertimeInput, OvertimeDescriptionUncheckedCreateWithoutOvertimeInput> | OvertimeDescriptionCreateWithoutOvertimeInput[] | OvertimeDescriptionUncheckedCreateWithoutOvertimeInput[]
    connectOrCreate?: OvertimeDescriptionCreateOrConnectWithoutOvertimeInput | OvertimeDescriptionCreateOrConnectWithoutOvertimeInput[]
    createMany?: OvertimeDescriptionCreateManyOvertimeInputEnvelope
    connect?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
  }

  export type OvertimeDescriptionUncheckedCreateNestedManyWithoutOvertimeInput = {
    create?: XOR<OvertimeDescriptionCreateWithoutOvertimeInput, OvertimeDescriptionUncheckedCreateWithoutOvertimeInput> | OvertimeDescriptionCreateWithoutOvertimeInput[] | OvertimeDescriptionUncheckedCreateWithoutOvertimeInput[]
    connectOrCreate?: OvertimeDescriptionCreateOrConnectWithoutOvertimeInput | OvertimeDescriptionCreateOrConnectWithoutOvertimeInput[]
    createMany?: OvertimeDescriptionCreateManyOvertimeInputEnvelope
    connect?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
  }

  export type OvertimeDescriptionUpdateManyWithoutOvertimeNestedInput = {
    create?: XOR<OvertimeDescriptionCreateWithoutOvertimeInput, OvertimeDescriptionUncheckedCreateWithoutOvertimeInput> | OvertimeDescriptionCreateWithoutOvertimeInput[] | OvertimeDescriptionUncheckedCreateWithoutOvertimeInput[]
    connectOrCreate?: OvertimeDescriptionCreateOrConnectWithoutOvertimeInput | OvertimeDescriptionCreateOrConnectWithoutOvertimeInput[]
    upsert?: OvertimeDescriptionUpsertWithWhereUniqueWithoutOvertimeInput | OvertimeDescriptionUpsertWithWhereUniqueWithoutOvertimeInput[]
    createMany?: OvertimeDescriptionCreateManyOvertimeInputEnvelope
    set?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    disconnect?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    delete?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    connect?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    update?: OvertimeDescriptionUpdateWithWhereUniqueWithoutOvertimeInput | OvertimeDescriptionUpdateWithWhereUniqueWithoutOvertimeInput[]
    updateMany?: OvertimeDescriptionUpdateManyWithWhereWithoutOvertimeInput | OvertimeDescriptionUpdateManyWithWhereWithoutOvertimeInput[]
    deleteMany?: OvertimeDescriptionScalarWhereInput | OvertimeDescriptionScalarWhereInput[]
  }

  export type OvertimeDescriptionUncheckedUpdateManyWithoutOvertimeNestedInput = {
    create?: XOR<OvertimeDescriptionCreateWithoutOvertimeInput, OvertimeDescriptionUncheckedCreateWithoutOvertimeInput> | OvertimeDescriptionCreateWithoutOvertimeInput[] | OvertimeDescriptionUncheckedCreateWithoutOvertimeInput[]
    connectOrCreate?: OvertimeDescriptionCreateOrConnectWithoutOvertimeInput | OvertimeDescriptionCreateOrConnectWithoutOvertimeInput[]
    upsert?: OvertimeDescriptionUpsertWithWhereUniqueWithoutOvertimeInput | OvertimeDescriptionUpsertWithWhereUniqueWithoutOvertimeInput[]
    createMany?: OvertimeDescriptionCreateManyOvertimeInputEnvelope
    set?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    disconnect?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    delete?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    connect?: OvertimeDescriptionWhereUniqueInput | OvertimeDescriptionWhereUniqueInput[]
    update?: OvertimeDescriptionUpdateWithWhereUniqueWithoutOvertimeInput | OvertimeDescriptionUpdateWithWhereUniqueWithoutOvertimeInput[]
    updateMany?: OvertimeDescriptionUpdateManyWithWhereWithoutOvertimeInput | OvertimeDescriptionUpdateManyWithWhereWithoutOvertimeInput[]
    deleteMany?: OvertimeDescriptionScalarWhereInput | OvertimeDescriptionScalarWhereInput[]
  }

  export type OvertimeCreateNestedOneWithoutDescriptionsInput = {
    create?: XOR<OvertimeCreateWithoutDescriptionsInput, OvertimeUncheckedCreateWithoutDescriptionsInput>
    connectOrCreate?: OvertimeCreateOrConnectWithoutDescriptionsInput
    connect?: OvertimeWhereUniqueInput
  }

  export type OvertimeUpdateOneRequiredWithoutDescriptionsNestedInput = {
    create?: XOR<OvertimeCreateWithoutDescriptionsInput, OvertimeUncheckedCreateWithoutDescriptionsInput>
    connectOrCreate?: OvertimeCreateOrConnectWithoutDescriptionsInput
    upsert?: OvertimeUpsertWithoutDescriptionsInput
    connect?: OvertimeWhereUniqueInput
    update?: XOR<XOR<OvertimeUpdateToOneWithWhereWithoutDescriptionsInput, OvertimeUpdateWithoutDescriptionsInput>, OvertimeUncheckedUpdateWithoutDescriptionsInput>
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectAssetCaptureType | EnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel> | $Enums.ProjectAssetCaptureType
  }

  export type NestedEnumProjectAssetCaptureTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProjectAssetCaptureType | EnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProjectAssetCaptureType[] | ListEnumProjectAssetCaptureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProjectAssetCaptureTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProjectAssetCaptureType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel>
    _max?: NestedEnumProjectAssetCaptureTypeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type ProjectCreateWithoutGroupInput = {
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectStatus?: ProjectStatusCreateNestedOneWithoutProjectsInput
    features?: FeatureCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutGroupInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    features?: FeatureUncheckedCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutGroupInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutGroupInput, ProjectUncheckedCreateWithoutGroupInput>
  }

  export type ProjectCreateManyGroupInputEnvelope = {
    data: ProjectCreateManyGroupInput | ProjectCreateManyGroupInput[]
    skipDuplicates?: boolean
  }

  export type ProjectUpsertWithWhereUniqueWithoutGroupInput = {
    where: ProjectWhereUniqueInput
    update: XOR<ProjectUpdateWithoutGroupInput, ProjectUncheckedUpdateWithoutGroupInput>
    create: XOR<ProjectCreateWithoutGroupInput, ProjectUncheckedCreateWithoutGroupInput>
  }

  export type ProjectUpdateWithWhereUniqueWithoutGroupInput = {
    where: ProjectWhereUniqueInput
    data: XOR<ProjectUpdateWithoutGroupInput, ProjectUncheckedUpdateWithoutGroupInput>
  }

  export type ProjectUpdateManyWithWhereWithoutGroupInput = {
    where: ProjectScalarWhereInput
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyWithoutGroupInput>
  }

  export type ProjectScalarWhereInput = {
    AND?: ProjectScalarWhereInput | ProjectScalarWhereInput[]
    OR?: ProjectScalarWhereInput[]
    NOT?: ProjectScalarWhereInput | ProjectScalarWhereInput[]
    id?: IntFilter<"Project"> | number
    name?: StringFilter<"Project"> | string
    name_en?: StringNullableFilter<"Project"> | string | null
    description?: StringFilter<"Project"> | string
    categoryType?: StringNullableFilter<"Project"> | string | null
    approval?: StringFilter<"Project"> | string
    approval_status?: StringFilter<"Project"> | string
    status?: StringFilter<"Project"> | string
    start_date?: DateTimeNullableFilter<"Project"> | Date | string | null
    end_date?: DateTimeNullableFilter<"Project"> | Date | string | null
    completeDate?: DateTimeNullableFilter<"Project"> | Date | string | null
    estimateWorkhours?: DecimalNullableFilter<"Project"> | Decimal | DecimalJsLike | number | string | null
    group_id?: IntNullableFilter<"Project"> | number | null
    projectStatusId?: IntNullableFilter<"Project"> | number | null
    is_deleted?: BoolFilter<"Project"> | boolean
    createdAt?: DateTimeFilter<"Project"> | Date | string
    createdBy?: IntNullableFilter<"Project"> | number | null
    updatedAt?: DateTimeFilter<"Project"> | Date | string
    updatedBy?: IntNullableFilter<"Project"> | number | null
  }

  export type ProjectCreateWithoutProjectStatusInput = {
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    group?: GroupCreateNestedOneWithoutProjectsInput
    features?: FeatureCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutProjectStatusInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    features?: FeatureUncheckedCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutProjectStatusInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutProjectStatusInput, ProjectUncheckedCreateWithoutProjectStatusInput>
  }

  export type ProjectCreateManyProjectStatusInputEnvelope = {
    data: ProjectCreateManyProjectStatusInput | ProjectCreateManyProjectStatusInput[]
    skipDuplicates?: boolean
  }

  export type FeatureCreateWithoutProjectStatusInput = {
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    project: ProjectCreateNestedOneWithoutFeaturesInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutFeatureInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutFeatureInput
  }

  export type FeatureUncheckedCreateWithoutProjectStatusInput = {
    id?: number
    projectId: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutFeatureInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutFeatureInput
  }

  export type FeatureCreateOrConnectWithoutProjectStatusInput = {
    where: FeatureWhereUniqueInput
    create: XOR<FeatureCreateWithoutProjectStatusInput, FeatureUncheckedCreateWithoutProjectStatusInput>
  }

  export type FeatureCreateManyProjectStatusInputEnvelope = {
    data: FeatureCreateManyProjectStatusInput | FeatureCreateManyProjectStatusInput[]
    skipDuplicates?: boolean
  }

  export type ProjectUpsertWithWhereUniqueWithoutProjectStatusInput = {
    where: ProjectWhereUniqueInput
    update: XOR<ProjectUpdateWithoutProjectStatusInput, ProjectUncheckedUpdateWithoutProjectStatusInput>
    create: XOR<ProjectCreateWithoutProjectStatusInput, ProjectUncheckedCreateWithoutProjectStatusInput>
  }

  export type ProjectUpdateWithWhereUniqueWithoutProjectStatusInput = {
    where: ProjectWhereUniqueInput
    data: XOR<ProjectUpdateWithoutProjectStatusInput, ProjectUncheckedUpdateWithoutProjectStatusInput>
  }

  export type ProjectUpdateManyWithWhereWithoutProjectStatusInput = {
    where: ProjectScalarWhereInput
    data: XOR<ProjectUpdateManyMutationInput, ProjectUncheckedUpdateManyWithoutProjectStatusInput>
  }

  export type FeatureUpsertWithWhereUniqueWithoutProjectStatusInput = {
    where: FeatureWhereUniqueInput
    update: XOR<FeatureUpdateWithoutProjectStatusInput, FeatureUncheckedUpdateWithoutProjectStatusInput>
    create: XOR<FeatureCreateWithoutProjectStatusInput, FeatureUncheckedCreateWithoutProjectStatusInput>
  }

  export type FeatureUpdateWithWhereUniqueWithoutProjectStatusInput = {
    where: FeatureWhereUniqueInput
    data: XOR<FeatureUpdateWithoutProjectStatusInput, FeatureUncheckedUpdateWithoutProjectStatusInput>
  }

  export type FeatureUpdateManyWithWhereWithoutProjectStatusInput = {
    where: FeatureScalarWhereInput
    data: XOR<FeatureUpdateManyMutationInput, FeatureUncheckedUpdateManyWithoutProjectStatusInput>
  }

  export type FeatureScalarWhereInput = {
    AND?: FeatureScalarWhereInput | FeatureScalarWhereInput[]
    OR?: FeatureScalarWhereInput[]
    NOT?: FeatureScalarWhereInput | FeatureScalarWhereInput[]
    id?: IntFilter<"Feature"> | number
    projectId?: IntFilter<"Feature"> | number
    name?: StringFilter<"Feature"> | string
    name_en?: StringNullableFilter<"Feature"> | string | null
    status?: StringFilter<"Feature"> | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFilter<"Feature"> | $Enums.ProjectAssetCaptureType
    backlogDescription?: JsonNullableFilter<"Feature">
    startDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    completeDate?: DateTimeNullableFilter<"Feature"> | Date | string | null
    estimateWorkhours?: DecimalNullableFilter<"Feature"> | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: IntNullableFilter<"Feature"> | number | null
    is_deleted?: BoolFilter<"Feature"> | boolean
    createdAt?: DateTimeFilter<"Feature"> | Date | string
    createdBy?: IntNullableFilter<"Feature"> | number | null
    updatedAt?: DateTimeFilter<"Feature"> | Date | string
    updatedBy?: IntNullableFilter<"Feature"> | number | null
  }

  export type GroupCreateWithoutProjectsInput = {
    name_th: string
    name_en?: string | null
  }

  export type GroupUncheckedCreateWithoutProjectsInput = {
    id?: number
    name_th: string
    name_en?: string | null
  }

  export type GroupCreateOrConnectWithoutProjectsInput = {
    where: GroupWhereUniqueInput
    create: XOR<GroupCreateWithoutProjectsInput, GroupUncheckedCreateWithoutProjectsInput>
  }

  export type ProjectStatusCreateWithoutProjectsInput = {
    priority?: number
    nameTh: string
    nameEn?: string | null
    features?: FeatureCreateNestedManyWithoutProjectStatusInput
  }

  export type ProjectStatusUncheckedCreateWithoutProjectsInput = {
    id?: number
    priority?: number
    nameTh: string
    nameEn?: string | null
    features?: FeatureUncheckedCreateNestedManyWithoutProjectStatusInput
  }

  export type ProjectStatusCreateOrConnectWithoutProjectsInput = {
    where: ProjectStatusWhereUniqueInput
    create: XOR<ProjectStatusCreateWithoutProjectsInput, ProjectStatusUncheckedCreateWithoutProjectsInput>
  }

  export type FeatureCreateWithoutProjectInput = {
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectStatus?: ProjectStatusCreateNestedOneWithoutFeaturesInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutFeatureInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutFeatureInput
  }

  export type FeatureUncheckedCreateWithoutProjectInput = {
    id?: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutFeatureInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutFeatureInput
  }

  export type FeatureCreateOrConnectWithoutProjectInput = {
    where: FeatureWhereUniqueInput
    create: XOR<FeatureCreateWithoutProjectInput, FeatureUncheckedCreateWithoutProjectInput>
  }

  export type FeatureCreateManyProjectInputEnvelope = {
    data: FeatureCreateManyProjectInput | FeatureCreateManyProjectInput[]
    skipDuplicates?: boolean
  }

  export type ProjectAssigneeCreateWithoutProjectInput = {
    userId: number
    position?: string | null
    feature?: FeatureCreateNestedOneWithoutProjectAssigneesInput
  }

  export type ProjectAssigneeUncheckedCreateWithoutProjectInput = {
    id?: number
    userId: number
    featureId?: number | null
    position?: string | null
  }

  export type ProjectAssigneeCreateOrConnectWithoutProjectInput = {
    where: ProjectAssigneeWhereUniqueInput
    create: XOR<ProjectAssigneeCreateWithoutProjectInput, ProjectAssigneeUncheckedCreateWithoutProjectInput>
  }

  export type ProjectAssigneeCreateManyProjectInputEnvelope = {
    data: ProjectAssigneeCreateManyProjectInput | ProjectAssigneeCreateManyProjectInput[]
    skipDuplicates?: boolean
  }

  export type TimesheetEntryCreateWithoutProjectInput = {
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    feature: FeatureCreateNestedOneWithoutTimesheetsInput
  }

  export type TimesheetEntryUncheckedCreateWithoutProjectInput = {
    id?: number
    featureId: number
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type TimesheetEntryCreateOrConnectWithoutProjectInput = {
    where: TimesheetEntryWhereUniqueInput
    create: XOR<TimesheetEntryCreateWithoutProjectInput, TimesheetEntryUncheckedCreateWithoutProjectInput>
  }

  export type TimesheetEntryCreateManyProjectInputEnvelope = {
    data: TimesheetEntryCreateManyProjectInput | TimesheetEntryCreateManyProjectInput[]
    skipDuplicates?: boolean
  }

  export type GroupUpsertWithoutProjectsInput = {
    update: XOR<GroupUpdateWithoutProjectsInput, GroupUncheckedUpdateWithoutProjectsInput>
    create: XOR<GroupCreateWithoutProjectsInput, GroupUncheckedCreateWithoutProjectsInput>
    where?: GroupWhereInput
  }

  export type GroupUpdateToOneWithWhereWithoutProjectsInput = {
    where?: GroupWhereInput
    data: XOR<GroupUpdateWithoutProjectsInput, GroupUncheckedUpdateWithoutProjectsInput>
  }

  export type GroupUpdateWithoutProjectsInput = {
    name_th?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GroupUncheckedUpdateWithoutProjectsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name_th?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectStatusUpsertWithoutProjectsInput = {
    update: XOR<ProjectStatusUpdateWithoutProjectsInput, ProjectStatusUncheckedUpdateWithoutProjectsInput>
    create: XOR<ProjectStatusCreateWithoutProjectsInput, ProjectStatusUncheckedCreateWithoutProjectsInput>
    where?: ProjectStatusWhereInput
  }

  export type ProjectStatusUpdateToOneWithWhereWithoutProjectsInput = {
    where?: ProjectStatusWhereInput
    data: XOR<ProjectStatusUpdateWithoutProjectsInput, ProjectStatusUncheckedUpdateWithoutProjectsInput>
  }

  export type ProjectStatusUpdateWithoutProjectsInput = {
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    features?: FeatureUpdateManyWithoutProjectStatusNestedInput
  }

  export type ProjectStatusUncheckedUpdateWithoutProjectsInput = {
    id?: IntFieldUpdateOperationsInput | number
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    features?: FeatureUncheckedUpdateManyWithoutProjectStatusNestedInput
  }

  export type FeatureUpsertWithWhereUniqueWithoutProjectInput = {
    where: FeatureWhereUniqueInput
    update: XOR<FeatureUpdateWithoutProjectInput, FeatureUncheckedUpdateWithoutProjectInput>
    create: XOR<FeatureCreateWithoutProjectInput, FeatureUncheckedCreateWithoutProjectInput>
  }

  export type FeatureUpdateWithWhereUniqueWithoutProjectInput = {
    where: FeatureWhereUniqueInput
    data: XOR<FeatureUpdateWithoutProjectInput, FeatureUncheckedUpdateWithoutProjectInput>
  }

  export type FeatureUpdateManyWithWhereWithoutProjectInput = {
    where: FeatureScalarWhereInput
    data: XOR<FeatureUpdateManyMutationInput, FeatureUncheckedUpdateManyWithoutProjectInput>
  }

  export type ProjectAssigneeUpsertWithWhereUniqueWithoutProjectInput = {
    where: ProjectAssigneeWhereUniqueInput
    update: XOR<ProjectAssigneeUpdateWithoutProjectInput, ProjectAssigneeUncheckedUpdateWithoutProjectInput>
    create: XOR<ProjectAssigneeCreateWithoutProjectInput, ProjectAssigneeUncheckedCreateWithoutProjectInput>
  }

  export type ProjectAssigneeUpdateWithWhereUniqueWithoutProjectInput = {
    where: ProjectAssigneeWhereUniqueInput
    data: XOR<ProjectAssigneeUpdateWithoutProjectInput, ProjectAssigneeUncheckedUpdateWithoutProjectInput>
  }

  export type ProjectAssigneeUpdateManyWithWhereWithoutProjectInput = {
    where: ProjectAssigneeScalarWhereInput
    data: XOR<ProjectAssigneeUpdateManyMutationInput, ProjectAssigneeUncheckedUpdateManyWithoutProjectInput>
  }

  export type ProjectAssigneeScalarWhereInput = {
    AND?: ProjectAssigneeScalarWhereInput | ProjectAssigneeScalarWhereInput[]
    OR?: ProjectAssigneeScalarWhereInput[]
    NOT?: ProjectAssigneeScalarWhereInput | ProjectAssigneeScalarWhereInput[]
    id?: IntFilter<"ProjectAssignee"> | number
    userId?: IntFilter<"ProjectAssignee"> | number
    projectId?: IntFilter<"ProjectAssignee"> | number
    featureId?: IntNullableFilter<"ProjectAssignee"> | number | null
    position?: StringNullableFilter<"ProjectAssignee"> | string | null
  }

  export type TimesheetEntryUpsertWithWhereUniqueWithoutProjectInput = {
    where: TimesheetEntryWhereUniqueInput
    update: XOR<TimesheetEntryUpdateWithoutProjectInput, TimesheetEntryUncheckedUpdateWithoutProjectInput>
    create: XOR<TimesheetEntryCreateWithoutProjectInput, TimesheetEntryUncheckedCreateWithoutProjectInput>
  }

  export type TimesheetEntryUpdateWithWhereUniqueWithoutProjectInput = {
    where: TimesheetEntryWhereUniqueInput
    data: XOR<TimesheetEntryUpdateWithoutProjectInput, TimesheetEntryUncheckedUpdateWithoutProjectInput>
  }

  export type TimesheetEntryUpdateManyWithWhereWithoutProjectInput = {
    where: TimesheetEntryScalarWhereInput
    data: XOR<TimesheetEntryUpdateManyMutationInput, TimesheetEntryUncheckedUpdateManyWithoutProjectInput>
  }

  export type TimesheetEntryScalarWhereInput = {
    AND?: TimesheetEntryScalarWhereInput | TimesheetEntryScalarWhereInput[]
    OR?: TimesheetEntryScalarWhereInput[]
    NOT?: TimesheetEntryScalarWhereInput | TimesheetEntryScalarWhereInput[]
    id?: IntFilter<"TimesheetEntry"> | number
    projectId?: IntFilter<"TimesheetEntry"> | number
    featureId?: IntFilter<"TimesheetEntry"> | number
    date?: DateTimeFilter<"TimesheetEntry"> | Date | string
    hours?: DecimalFilter<"TimesheetEntry"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableFilter<"TimesheetEntry"> | string | null
    status?: StringFilter<"TimesheetEntry"> | string
    is_deleted?: BoolFilter<"TimesheetEntry"> | boolean
    createdAt?: DateTimeFilter<"TimesheetEntry"> | Date | string
    createdBy?: IntNullableFilter<"TimesheetEntry"> | number | null
    updatedAt?: DateTimeFilter<"TimesheetEntry"> | Date | string
    updatedBy?: IntNullableFilter<"TimesheetEntry"> | number | null
  }

  export type ProjectCreateWithoutFeaturesInput = {
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    group?: GroupCreateNestedOneWithoutProjectsInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutProjectsInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutFeaturesInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutFeaturesInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutFeaturesInput, ProjectUncheckedCreateWithoutFeaturesInput>
  }

  export type ProjectStatusCreateWithoutFeaturesInput = {
    priority?: number
    nameTh: string
    nameEn?: string | null
    projects?: ProjectCreateNestedManyWithoutProjectStatusInput
  }

  export type ProjectStatusUncheckedCreateWithoutFeaturesInput = {
    id?: number
    priority?: number
    nameTh: string
    nameEn?: string | null
    projects?: ProjectUncheckedCreateNestedManyWithoutProjectStatusInput
  }

  export type ProjectStatusCreateOrConnectWithoutFeaturesInput = {
    where: ProjectStatusWhereUniqueInput
    create: XOR<ProjectStatusCreateWithoutFeaturesInput, ProjectStatusUncheckedCreateWithoutFeaturesInput>
  }

  export type ProjectAssigneeCreateWithoutFeatureInput = {
    userId: number
    position?: string | null
    project: ProjectCreateNestedOneWithoutProjectAssigneesInput
  }

  export type ProjectAssigneeUncheckedCreateWithoutFeatureInput = {
    id?: number
    userId: number
    projectId: number
    position?: string | null
  }

  export type ProjectAssigneeCreateOrConnectWithoutFeatureInput = {
    where: ProjectAssigneeWhereUniqueInput
    create: XOR<ProjectAssigneeCreateWithoutFeatureInput, ProjectAssigneeUncheckedCreateWithoutFeatureInput>
  }

  export type ProjectAssigneeCreateManyFeatureInputEnvelope = {
    data: ProjectAssigneeCreateManyFeatureInput | ProjectAssigneeCreateManyFeatureInput[]
    skipDuplicates?: boolean
  }

  export type TimesheetEntryCreateWithoutFeatureInput = {
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    project: ProjectCreateNestedOneWithoutTimesheetsInput
  }

  export type TimesheetEntryUncheckedCreateWithoutFeatureInput = {
    id?: number
    projectId: number
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type TimesheetEntryCreateOrConnectWithoutFeatureInput = {
    where: TimesheetEntryWhereUniqueInput
    create: XOR<TimesheetEntryCreateWithoutFeatureInput, TimesheetEntryUncheckedCreateWithoutFeatureInput>
  }

  export type TimesheetEntryCreateManyFeatureInputEnvelope = {
    data: TimesheetEntryCreateManyFeatureInput | TimesheetEntryCreateManyFeatureInput[]
    skipDuplicates?: boolean
  }

  export type ProjectUpsertWithoutFeaturesInput = {
    update: XOR<ProjectUpdateWithoutFeaturesInput, ProjectUncheckedUpdateWithoutFeaturesInput>
    create: XOR<ProjectCreateWithoutFeaturesInput, ProjectUncheckedCreateWithoutFeaturesInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutFeaturesInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutFeaturesInput, ProjectUncheckedUpdateWithoutFeaturesInput>
  }

  export type ProjectUpdateWithoutFeaturesInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    group?: GroupUpdateOneWithoutProjectsNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutProjectsNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutFeaturesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectStatusUpsertWithoutFeaturesInput = {
    update: XOR<ProjectStatusUpdateWithoutFeaturesInput, ProjectStatusUncheckedUpdateWithoutFeaturesInput>
    create: XOR<ProjectStatusCreateWithoutFeaturesInput, ProjectStatusUncheckedCreateWithoutFeaturesInput>
    where?: ProjectStatusWhereInput
  }

  export type ProjectStatusUpdateToOneWithWhereWithoutFeaturesInput = {
    where?: ProjectStatusWhereInput
    data: XOR<ProjectStatusUpdateWithoutFeaturesInput, ProjectStatusUncheckedUpdateWithoutFeaturesInput>
  }

  export type ProjectStatusUpdateWithoutFeaturesInput = {
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    projects?: ProjectUpdateManyWithoutProjectStatusNestedInput
  }

  export type ProjectStatusUncheckedUpdateWithoutFeaturesInput = {
    id?: IntFieldUpdateOperationsInput | number
    priority?: IntFieldUpdateOperationsInput | number
    nameTh?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    projects?: ProjectUncheckedUpdateManyWithoutProjectStatusNestedInput
  }

  export type ProjectAssigneeUpsertWithWhereUniqueWithoutFeatureInput = {
    where: ProjectAssigneeWhereUniqueInput
    update: XOR<ProjectAssigneeUpdateWithoutFeatureInput, ProjectAssigneeUncheckedUpdateWithoutFeatureInput>
    create: XOR<ProjectAssigneeCreateWithoutFeatureInput, ProjectAssigneeUncheckedCreateWithoutFeatureInput>
  }

  export type ProjectAssigneeUpdateWithWhereUniqueWithoutFeatureInput = {
    where: ProjectAssigneeWhereUniqueInput
    data: XOR<ProjectAssigneeUpdateWithoutFeatureInput, ProjectAssigneeUncheckedUpdateWithoutFeatureInput>
  }

  export type ProjectAssigneeUpdateManyWithWhereWithoutFeatureInput = {
    where: ProjectAssigneeScalarWhereInput
    data: XOR<ProjectAssigneeUpdateManyMutationInput, ProjectAssigneeUncheckedUpdateManyWithoutFeatureInput>
  }

  export type TimesheetEntryUpsertWithWhereUniqueWithoutFeatureInput = {
    where: TimesheetEntryWhereUniqueInput
    update: XOR<TimesheetEntryUpdateWithoutFeatureInput, TimesheetEntryUncheckedUpdateWithoutFeatureInput>
    create: XOR<TimesheetEntryCreateWithoutFeatureInput, TimesheetEntryUncheckedCreateWithoutFeatureInput>
  }

  export type TimesheetEntryUpdateWithWhereUniqueWithoutFeatureInput = {
    where: TimesheetEntryWhereUniqueInput
    data: XOR<TimesheetEntryUpdateWithoutFeatureInput, TimesheetEntryUncheckedUpdateWithoutFeatureInput>
  }

  export type TimesheetEntryUpdateManyWithWhereWithoutFeatureInput = {
    where: TimesheetEntryScalarWhereInput
    data: XOR<TimesheetEntryUpdateManyMutationInput, TimesheetEntryUncheckedUpdateManyWithoutFeatureInput>
  }

  export type ProjectCreateWithoutProjectAssigneesInput = {
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    group?: GroupCreateNestedOneWithoutProjectsInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutProjectsInput
    features?: FeatureCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutProjectAssigneesInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    features?: FeatureUncheckedCreateNestedManyWithoutProjectInput
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutProjectAssigneesInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutProjectAssigneesInput, ProjectUncheckedCreateWithoutProjectAssigneesInput>
  }

  export type FeatureCreateWithoutProjectAssigneesInput = {
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    project: ProjectCreateNestedOneWithoutFeaturesInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutFeaturesInput
    timesheets?: TimesheetEntryCreateNestedManyWithoutFeatureInput
  }

  export type FeatureUncheckedCreateWithoutProjectAssigneesInput = {
    id?: number
    projectId: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    timesheets?: TimesheetEntryUncheckedCreateNestedManyWithoutFeatureInput
  }

  export type FeatureCreateOrConnectWithoutProjectAssigneesInput = {
    where: FeatureWhereUniqueInput
    create: XOR<FeatureCreateWithoutProjectAssigneesInput, FeatureUncheckedCreateWithoutProjectAssigneesInput>
  }

  export type ProjectUpsertWithoutProjectAssigneesInput = {
    update: XOR<ProjectUpdateWithoutProjectAssigneesInput, ProjectUncheckedUpdateWithoutProjectAssigneesInput>
    create: XOR<ProjectCreateWithoutProjectAssigneesInput, ProjectUncheckedCreateWithoutProjectAssigneesInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutProjectAssigneesInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutProjectAssigneesInput, ProjectUncheckedUpdateWithoutProjectAssigneesInput>
  }

  export type ProjectUpdateWithoutProjectAssigneesInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    group?: GroupUpdateOneWithoutProjectsNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutProjectsNestedInput
    features?: FeatureUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutProjectAssigneesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    features?: FeatureUncheckedUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type FeatureUpsertWithoutProjectAssigneesInput = {
    update: XOR<FeatureUpdateWithoutProjectAssigneesInput, FeatureUncheckedUpdateWithoutProjectAssigneesInput>
    create: XOR<FeatureCreateWithoutProjectAssigneesInput, FeatureUncheckedCreateWithoutProjectAssigneesInput>
    where?: FeatureWhereInput
  }

  export type FeatureUpdateToOneWithWhereWithoutProjectAssigneesInput = {
    where?: FeatureWhereInput
    data: XOR<FeatureUpdateWithoutProjectAssigneesInput, FeatureUncheckedUpdateWithoutProjectAssigneesInput>
  }

  export type FeatureUpdateWithoutProjectAssigneesInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    project?: ProjectUpdateOneRequiredWithoutFeaturesNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutFeaturesNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateWithoutProjectAssigneesInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureCreateWithoutTimesheetsInput = {
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    project: ProjectCreateNestedOneWithoutFeaturesInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutFeaturesInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutFeatureInput
  }

  export type FeatureUncheckedCreateWithoutTimesheetsInput = {
    id?: number
    projectId: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutFeatureInput
  }

  export type FeatureCreateOrConnectWithoutTimesheetsInput = {
    where: FeatureWhereUniqueInput
    create: XOR<FeatureCreateWithoutTimesheetsInput, FeatureUncheckedCreateWithoutTimesheetsInput>
  }

  export type ProjectCreateWithoutTimesheetsInput = {
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    group?: GroupCreateNestedOneWithoutProjectsInput
    projectStatus?: ProjectStatusCreateNestedOneWithoutProjectsInput
    features?: FeatureCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeCreateNestedManyWithoutProjectInput
  }

  export type ProjectUncheckedCreateWithoutTimesheetsInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
    features?: FeatureUncheckedCreateNestedManyWithoutProjectInput
    projectAssignees?: ProjectAssigneeUncheckedCreateNestedManyWithoutProjectInput
  }

  export type ProjectCreateOrConnectWithoutTimesheetsInput = {
    where: ProjectWhereUniqueInput
    create: XOR<ProjectCreateWithoutTimesheetsInput, ProjectUncheckedCreateWithoutTimesheetsInput>
  }

  export type FeatureUpsertWithoutTimesheetsInput = {
    update: XOR<FeatureUpdateWithoutTimesheetsInput, FeatureUncheckedUpdateWithoutTimesheetsInput>
    create: XOR<FeatureCreateWithoutTimesheetsInput, FeatureUncheckedCreateWithoutTimesheetsInput>
    where?: FeatureWhereInput
  }

  export type FeatureUpdateToOneWithWhereWithoutTimesheetsInput = {
    where?: FeatureWhereInput
    data: XOR<FeatureUpdateWithoutTimesheetsInput, FeatureUncheckedUpdateWithoutTimesheetsInput>
  }

  export type FeatureUpdateWithoutTimesheetsInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    project?: ProjectUpdateOneRequiredWithoutFeaturesNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutFeaturesNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateWithoutTimesheetsInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutFeatureNestedInput
  }

  export type ProjectUpsertWithoutTimesheetsInput = {
    update: XOR<ProjectUpdateWithoutTimesheetsInput, ProjectUncheckedUpdateWithoutTimesheetsInput>
    create: XOR<ProjectCreateWithoutTimesheetsInput, ProjectUncheckedCreateWithoutTimesheetsInput>
    where?: ProjectWhereInput
  }

  export type ProjectUpdateToOneWithWhereWithoutTimesheetsInput = {
    where?: ProjectWhereInput
    data: XOR<ProjectUpdateWithoutTimesheetsInput, ProjectUncheckedUpdateWithoutTimesheetsInput>
  }

  export type ProjectUpdateWithoutTimesheetsInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    group?: GroupUpdateOneWithoutProjectsNestedInput
    projectStatus?: ProjectStatusUpdateOneWithoutProjectsNestedInput
    features?: FeatureUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutTimesheetsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    features?: FeatureUncheckedUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type OvertimeDescriptionCreateWithoutOvertimeInput = {
    assignee: string
    description: string
    duration: Decimal | DecimalJsLike | number | string
    date?: Date | string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
  }

  export type OvertimeDescriptionUncheckedCreateWithoutOvertimeInput = {
    id?: number
    assignee: string
    description: string
    duration: Decimal | DecimalJsLike | number | string
    date?: Date | string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
  }

  export type OvertimeDescriptionCreateOrConnectWithoutOvertimeInput = {
    where: OvertimeDescriptionWhereUniqueInput
    create: XOR<OvertimeDescriptionCreateWithoutOvertimeInput, OvertimeDescriptionUncheckedCreateWithoutOvertimeInput>
  }

  export type OvertimeDescriptionCreateManyOvertimeInputEnvelope = {
    data: OvertimeDescriptionCreateManyOvertimeInput | OvertimeDescriptionCreateManyOvertimeInput[]
    skipDuplicates?: boolean
  }

  export type OvertimeDescriptionUpsertWithWhereUniqueWithoutOvertimeInput = {
    where: OvertimeDescriptionWhereUniqueInput
    update: XOR<OvertimeDescriptionUpdateWithoutOvertimeInput, OvertimeDescriptionUncheckedUpdateWithoutOvertimeInput>
    create: XOR<OvertimeDescriptionCreateWithoutOvertimeInput, OvertimeDescriptionUncheckedCreateWithoutOvertimeInput>
  }

  export type OvertimeDescriptionUpdateWithWhereUniqueWithoutOvertimeInput = {
    where: OvertimeDescriptionWhereUniqueInput
    data: XOR<OvertimeDescriptionUpdateWithoutOvertimeInput, OvertimeDescriptionUncheckedUpdateWithoutOvertimeInput>
  }

  export type OvertimeDescriptionUpdateManyWithWhereWithoutOvertimeInput = {
    where: OvertimeDescriptionScalarWhereInput
    data: XOR<OvertimeDescriptionUpdateManyMutationInput, OvertimeDescriptionUncheckedUpdateManyWithoutOvertimeInput>
  }

  export type OvertimeDescriptionScalarWhereInput = {
    AND?: OvertimeDescriptionScalarWhereInput | OvertimeDescriptionScalarWhereInput[]
    OR?: OvertimeDescriptionScalarWhereInput[]
    NOT?: OvertimeDescriptionScalarWhereInput | OvertimeDescriptionScalarWhereInput[]
    id?: IntFilter<"OvertimeDescription"> | number
    overtimeId?: IntFilter<"OvertimeDescription"> | number
    assignee?: StringFilter<"OvertimeDescription"> | string
    description?: StringFilter<"OvertimeDescription"> | string
    duration?: DecimalFilter<"OvertimeDescription"> | Decimal | DecimalJsLike | number | string
    date?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    startDate?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
    endDate?: DateTimeNullableFilter<"OvertimeDescription"> | Date | string | null
  }

  export type OvertimeCreateWithoutDescriptionsInput = {
    requesterId: string
    requestDate: Date | string
    status: string
    isDeleted?: boolean
    createdAt?: Date | string
    createdBy: string
    updatedAt?: Date | string
    updatedBy?: string | null
  }

  export type OvertimeUncheckedCreateWithoutDescriptionsInput = {
    id?: number
    requesterId: string
    requestDate: Date | string
    status: string
    isDeleted?: boolean
    createdAt?: Date | string
    createdBy: string
    updatedAt?: Date | string
    updatedBy?: string | null
  }

  export type OvertimeCreateOrConnectWithoutDescriptionsInput = {
    where: OvertimeWhereUniqueInput
    create: XOR<OvertimeCreateWithoutDescriptionsInput, OvertimeUncheckedCreateWithoutDescriptionsInput>
  }

  export type OvertimeUpsertWithoutDescriptionsInput = {
    update: XOR<OvertimeUpdateWithoutDescriptionsInput, OvertimeUncheckedUpdateWithoutDescriptionsInput>
    create: XOR<OvertimeCreateWithoutDescriptionsInput, OvertimeUncheckedCreateWithoutDescriptionsInput>
    where?: OvertimeWhereInput
  }

  export type OvertimeUpdateToOneWithWhereWithoutDescriptionsInput = {
    where?: OvertimeWhereInput
    data: XOR<OvertimeUpdateWithoutDescriptionsInput, OvertimeUncheckedUpdateWithoutDescriptionsInput>
  }

  export type OvertimeUpdateWithoutDescriptionsInput = {
    requesterId?: StringFieldUpdateOperationsInput | string
    requestDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OvertimeUncheckedUpdateWithoutDescriptionsInput = {
    id?: IntFieldUpdateOperationsInput | number
    requesterId?: StringFieldUpdateOperationsInput | string
    requestDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectCreateManyGroupInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type ProjectUpdateWithoutGroupInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatus?: ProjectStatusUpdateOneWithoutProjectsNestedInput
    features?: FeatureUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutGroupInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    features?: FeatureUncheckedUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateManyWithoutGroupInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ProjectCreateManyProjectStatusInput = {
    id?: number
    name: string
    name_en?: string | null
    description: string
    categoryType?: string | null
    approval?: string
    approval_status?: string
    status?: string
    start_date?: Date | string | null
    end_date?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    group_id?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type FeatureCreateManyProjectStatusInput = {
    id?: number
    projectId: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type ProjectUpdateWithoutProjectStatusInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    group?: GroupUpdateOneWithoutProjectsNestedInput
    features?: FeatureUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateWithoutProjectStatusInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    features?: FeatureUncheckedUpdateManyWithoutProjectNestedInput
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutProjectNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ProjectUncheckedUpdateManyWithoutProjectStatusInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    categoryType?: NullableStringFieldUpdateOperationsInput | string | null
    approval?: StringFieldUpdateOperationsInput | string
    approval_status?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    group_id?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type FeatureUpdateWithoutProjectStatusInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    project?: ProjectUpdateOneRequiredWithoutFeaturesNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutFeatureNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateWithoutProjectStatusInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutFeatureNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateManyWithoutProjectStatusInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type FeatureCreateManyProjectInput = {
    id?: number
    name: string
    name_en?: string | null
    status?: string
    assetCaptureType?: $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: Date | string | null
    endDate?: Date | string | null
    completeDate?: Date | string | null
    estimateWorkhours?: Decimal | DecimalJsLike | number | string | null
    projectStatusId?: number | null
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type ProjectAssigneeCreateManyProjectInput = {
    id?: number
    userId: number
    featureId?: number | null
    position?: string | null
  }

  export type TimesheetEntryCreateManyProjectInput = {
    id?: number
    featureId: number
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type FeatureUpdateWithoutProjectInput = {
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectStatus?: ProjectStatusUpdateOneWithoutFeaturesNestedInput
    projectAssignees?: ProjectAssigneeUpdateManyWithoutFeatureNestedInput
    timesheets?: TimesheetEntryUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateWithoutProjectInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    projectAssignees?: ProjectAssigneeUncheckedUpdateManyWithoutFeatureNestedInput
    timesheets?: TimesheetEntryUncheckedUpdateManyWithoutFeatureNestedInput
  }

  export type FeatureUncheckedUpdateManyWithoutProjectInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    name_en?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    assetCaptureType?: EnumProjectAssetCaptureTypeFieldUpdateOperationsInput | $Enums.ProjectAssetCaptureType
    backlogDescription?: NullableJsonNullValueInput | InputJsonValue
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completeDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    estimateWorkhours?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    projectStatusId?: NullableIntFieldUpdateOperationsInput | number | null
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ProjectAssigneeUpdateWithoutProjectInput = {
    userId?: IntFieldUpdateOperationsInput | number
    position?: NullableStringFieldUpdateOperationsInput | string | null
    feature?: FeatureUpdateOneWithoutProjectAssigneesNestedInput
  }

  export type ProjectAssigneeUncheckedUpdateWithoutProjectInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    featureId?: NullableIntFieldUpdateOperationsInput | number | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectAssigneeUncheckedUpdateManyWithoutProjectInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    featureId?: NullableIntFieldUpdateOperationsInput | number | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TimesheetEntryUpdateWithoutProjectInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    feature?: FeatureUpdateOneRequiredWithoutTimesheetsNestedInput
  }

  export type TimesheetEntryUncheckedUpdateWithoutProjectInput = {
    id?: IntFieldUpdateOperationsInput | number
    featureId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimesheetEntryUncheckedUpdateManyWithoutProjectInput = {
    id?: IntFieldUpdateOperationsInput | number
    featureId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ProjectAssigneeCreateManyFeatureInput = {
    id?: number
    userId: number
    projectId: number
    position?: string | null
  }

  export type TimesheetEntryCreateManyFeatureInput = {
    id?: number
    projectId: number
    date: Date | string
    hours: Decimal | DecimalJsLike | number | string
    description?: string | null
    status?: string
    is_deleted?: boolean
    createdAt?: Date | string
    createdBy?: number | null
    updatedAt?: Date | string
    updatedBy?: number | null
  }

  export type ProjectAssigneeUpdateWithoutFeatureInput = {
    userId?: IntFieldUpdateOperationsInput | number
    position?: NullableStringFieldUpdateOperationsInput | string | null
    project?: ProjectUpdateOneRequiredWithoutProjectAssigneesNestedInput
  }

  export type ProjectAssigneeUncheckedUpdateWithoutFeatureInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProjectAssigneeUncheckedUpdateManyWithoutFeatureInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    position?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TimesheetEntryUpdateWithoutFeatureInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    project?: ProjectUpdateOneRequiredWithoutTimesheetsNestedInput
  }

  export type TimesheetEntryUncheckedUpdateWithoutFeatureInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TimesheetEntryUncheckedUpdateManyWithoutFeatureInput = {
    id?: IntFieldUpdateOperationsInput | number
    projectId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    hours?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    is_deleted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: NullableIntFieldUpdateOperationsInput | number | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type OvertimeDescriptionCreateManyOvertimeInput = {
    id?: number
    assignee: string
    description: string
    duration: Decimal | DecimalJsLike | number | string
    date?: Date | string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
  }

  export type OvertimeDescriptionUpdateWithoutOvertimeInput = {
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type OvertimeDescriptionUncheckedUpdateWithoutOvertimeInput = {
    id?: IntFieldUpdateOperationsInput | number
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type OvertimeDescriptionUncheckedUpdateManyWithoutOvertimeInput = {
    id?: IntFieldUpdateOperationsInput | number
    assignee?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    duration?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}