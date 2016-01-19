/*
 * Copyright (C) 2007-2008 ARM Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*
 *
 */

    .eabi_attribute 24, 1
    .eabi_attribute 25, 1

    .arm
    .fpu neon
    .text
    .syntax unified

    .global armVCM4P10_UnpackBlock4x4
armVCM4P10_UnpackBlock4x4:
    PUSH     {r4-r8,lr}
    LDR      r2,[r0,#0]
    MOV      r7,#0x1f
    MOV      r4,#0
    MOV      r5,#0
    LDRB     r3,[r2],#1
    STRD     r4,r5,[r1,#0]
    STRD     r4,r5,[r1,#8]
    STRD     r4,r5,[r1,#0x10]
    STRD     r4,r5,[r1,#0x18]
unpackLoop:
    TST      r3,#0x10
    LDRSBNE  r5,[r2,#1]
    LDRBNE   r4,[r2],#2
    AND      r6,r7,r3,LSL #1
    LDRSBEQ  r4,[r2],#1
    ORRNE    r4,r4,r5,LSL #8
    TST      r3,#0x20
    LDRBEQ   r3,[r2],#1
    STRH     r4,[r1,r6]
    BEQ      unpackLoop
    STR      r2,[r0,#0]
    POP      {r4-r8,pc}
    .end
