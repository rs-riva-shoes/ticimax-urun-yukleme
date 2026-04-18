import { describe, it, expect, vi } from 'vitest';

// Proper class mock for OpenAI constructor
vi.mock('openai', () => {
    return {
        default: class {
            chat: { completions: { create: unknown } };
            constructor() {
                this.chat = {
                    completions: {
                        create: vi.fn()
                    }
                };
            }
        }
    };
});

import { openai } from '@/services/openai';

describe('OpenAI Service Init', () => {
    it('should initialize the client', () => {
        expect(openai).toBeDefined();
    });
});
