'use strict';

const Lyra = require('../../src');
const Utils = require('../utils');

describe('alterantives()', () => {
    it('should validate if no alternative is provided', () => {
        const schema = Lyra.alt();

        Utils.validate(schema, [
            { value: undefined },
            {
                value: 1,
                error: {
                    code: 'alternatives.any',
                    message: 'unknown must match at least one of the provided schemas',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should apply deep labels', () => {
        const schema = Lyra.alt(Lyra.str()).label('A');

        Utils.validate(schema, [
            {
                value: 1,
                error: {
                    code: 'string.base',
                    message: 'A must be a string',
                    local: { label: 'A' },
                },
            },
        ]);
    });

    it('should compile schemas', () => {
        const schema = Lyra.compile([
            'x',
            Lyra.number(),
        ]);

        Utils.validate(schema, [
            { value: 'x' },
            { value: 1 },
            {
                value: 'y',
                error: {
                    code: 'alternatives.any',
                    message: 'unknown must match at least one of the provided schemas',
                    local: {
                        attempts: [
                            {
                                code: 'any.only',
                                message: 'unknown must be x',
                                local: { values: ['x'], label: 'unknown' },
                            },
                            {
                                code: 'number.base',
                                message: 'unknown must be a number',
                                local: { label: 'unknown' },
                            },
                        ],
                        label: 'unknown',
                    },
                },
            },
        ]);
    });

    describe('try()', () => {
        it('should match any schemas', () => {
            const schema = Lyra.alt(Lyra.num().min(1).convert().required(), Lyra.str());

            Utils.validate(schema, [
                { value: undefined },
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
                { value: 'x' },
                {
                    value: 0,
                    error: {
                        code: 'alternatives.any',
                        message: 'unknown must match at least one of the provided schemas',
                        local: {
                            attempts: [
                                {
                                    code: 'number.min',
                                    message: 'unknown must be greater than or equal to 1',
                                    local: { limit: 1, label: 'unknown' },
                                },
                                {
                                    code: 'string.base',
                                    message: 'unknown must be a string',
                                    local: { label: 'unknown' },
                                },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should match schemas added via multiple calls', () => {
            const schema = Lyra.alt(Lyra.num()).try(Lyra.str());

            Utils.validate(schema, [
                { value: 'x' },
                { value: 1 },
                {
                    value: true,
                    error: {
                        code: 'alternatives.any',
                        message: 'unknown must match at least one of the provided schemas',
                        local: {
                            attempts: [
                                {
                                    code: 'number.base',
                                    message: 'unknown must be a number',
                                    local: { label: 'unknown' },
                                },
                                {
                                    code: 'string.base',
                                    message: 'unknown must be a string',
                                    local: { label: 'unknown' },
                                },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should match single item', () => {
            const schema = Lyra.alt(Lyra.str());

            Utils.validate(schema, [
                {
                    value: 1,
                    error: {
                        code: 'string.base',
                        message: 'unknown must be a string',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should collect all errors', () => {
            const schema = Lyra.alt(Lyra.str(), Lyra.num().min(2).multiple(2)).settings({ abortEarly: false });

            Utils.validate(schema, [
                {
                    value: 1,
                    error: {
                        code: 'alternatives.any',
                        message: 'unknown must match at least one of the provided schemas',
                        local: {
                            attempts: [
                                {
                                    code: 'string.base',
                                    message: 'unknown must be a string',
                                    local: { label: 'unknown' },
                                },
                                {
                                    code: 'number.min',
                                    message: 'unknown must be greater than or equal to 2',
                                    local: { limit: 2, label: 'unknown' },
                                },
                                {
                                    code: 'number.multiple',
                                    message: 'unknown must be a multiple of 2',
                                    local: { factor: 2, label: 'unknown' },
                                },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });
    });

    describe('match()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.alt().match('x')).toThrow('Mode must be all, one or any');
        });

        it('should match exactly one schema', () => {
            const schema = Lyra.alt(Lyra.num().multiple(2), Lyra.num().multiple(5)).match('one');

            Utils.validate(schema, [
                { value: 2 },
                { value: 5 },
                {
                    value: 'x',
                    error: {
                        code: 'alternatives.any',
                        message: 'unknown must match at least one of the provided schemas',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 10,
                    error: {
                        code: 'alternatives.one',
                        message: 'unknown must not match more than one of the provided schemas',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should match all schemas', () => {
            const schema = Lyra.alt(Lyra.num().convert(), Lyra.str()).match('all');

            Utils.validate(schema, [
                { value: '2' },
                {
                    value: 2,
                    error: {
                        code: 'alternatives.all',
                        message: 'unknown must match all of the provided schemas',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'x',
                    error: {
                        code: 'alternatives.all',
                        message: 'unknown must match all of the provided schemas',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should return modified value from the last schema', () => {
            const schema = Lyra.alt(Lyra.str(), Lyra.num().convert()).match('all');

            Utils.validate(schema, [
                {
                    value: '2',
                    output: 2,
                },
            ]);
        });
    });
});
