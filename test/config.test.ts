import { afterAll, expect, test } from 'vitest'
import * as C from '../src/config'
import * as O from 'fp-ts/Option'

test('should have Fastify port configured', () => {
    expect(C.port).toStrictEqual(O.some(3000))
})

test('should have HackerRank API key', () => {
    expect(C.apiKey).toStrictEqual(O.some('dGhpcy1pcy1hLWZha2Uta2V5'))
})

test('should have HackerRank service URL', () => {
    expect(C.hackerRankSvc).toStrictEqual(O.some('http://localhost'))
})