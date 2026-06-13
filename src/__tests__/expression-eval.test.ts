import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '@/lib/expression-eval';

describe('evaluateExpression', () => {
  // 简单数字
  it('简单数字', () => {
    expect(evaluateExpression('42', {})).toBe(42);
    expect(evaluateExpression('3.14', {})).toBe(3.14);
  });

  // 变量替换
  it('score 变量替换', () => {
    expect(evaluateExpression('score', { score: 75 })).toBe(75);
  });

  it('speed 变量替换', () => {
    expect(evaluateExpression('speed', { speed: 18 })).toBe(18);
  });

  it('effectiveScore 变量替换', () => {
    expect(evaluateExpression('effectiveScore', { effectiveScore: 60 })).toBe(60);
  });

  // 中文变量替换
  it('中文变量 分数', () => {
    expect(evaluateExpression('分数', { score: 80 })).toBe(80);
  });

  it('中文变量 速度', () => {
    expect(evaluateExpression('速度', { speed: 20 })).toBe(20);
  });

  it('中文变量 有效分数', () => {
    expect(evaluateExpression('有效分数', { effectiveScore: 65 })).toBe(65);
  });

  // 基本运算
  it('加法', () => {
    expect(evaluateExpression('score + 10', { score: 70 })).toBe(80);
  });

  it('减法', () => {
    expect(evaluateExpression('score - 5', { score: 80 })).toBe(75);
  });

  it('乘法', () => {
    expect(evaluateExpression('score * 1.5', { score: 60 })).toBe(90);
  });

  it('除法', () => {
    expect(evaluateExpression('score / 2', { score: 100 })).toBe(50);
  });

  // 复合表达式
  it('复合表达式 score * 1.2 + 5', () => {
    expect(evaluateExpression('score * 1.2 + 5', { score: 50 })).toBe(65);
  });

  it('复合表达式 (score + speed) * 0.5', () => {
    expect(evaluateExpression('(score + speed) * 0.5', { score: 60, speed: 20 })).toBe(40);
  });

  // 规则引擎中常见的表达式
  it('规则引擎表达式: score * 1', () => {
    expect(evaluateExpression('score * 1', { score: 75 })).toBe(75);
  });

  it('规则引擎表达式: score * 1.1', () => {
    expect(evaluateExpression('score * 1.1', { score: 70 })).toBeCloseTo(77, 1);
  });

  it('规则引擎表达式: score * 1.2', () => {
    expect(evaluateExpression('score * 1.2', { score: 65 })).toBeCloseTo(78, 1);
  });

  it('规则引擎表达式: score * 0.8', () => {
    expect(evaluateExpression('score * 0.8', { score: 80 })).toBe(64);
  });

  // 速度相关表达式
  it('速度表达式: speed * 2', () => {
    expect(evaluateExpression('speed * 2', { speed: 15 })).toBe(30);
  });

  // 未定义变量
  it('未定义变量视为 0', () => {
    expect(evaluateExpression('score + unknown', { score: 50 })).toBe(50);
  });

  // 复杂括号
  it('嵌套括号', () => {
    expect(evaluateExpression('((score + 5) * 2)', { score: 10 })).toBe(30);
  });
});
