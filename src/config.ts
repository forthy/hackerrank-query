import 'dotenv/config'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

export const port = pipe(
  O.fromNullable(process.env.PORT),
  O.flatMap((x) =>
    pipe(
      pipe(
        x,
        O.fromPredicate<string>((s) => !Number.isNaN(Number(s)))
      ),
      O.map((s) => Number(s))
    )
  )
)

export const apiKey = pipe(
  O.fromNullable(process.env.API_KEY),
  O.flatMap((k) =>
    pipe(
      k,
      O.fromPredicate<string>((x) => x !== '')
    )
  ),
  O.map((k) => Buffer.from(k, 'utf-8').toString('base64'))
)

export const hackerRankSvc = pipe(
  O.fromNullable(process.env.HACKERRANK_SVC),
  O.flatMap((k) =>
    pipe(
      k,
      O.fromPredicate<string>((x) => x !== '')
    )
  )
)

