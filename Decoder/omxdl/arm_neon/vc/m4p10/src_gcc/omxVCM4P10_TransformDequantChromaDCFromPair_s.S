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

    .global omxVCM4P10_TransformDequantChromaDCFromPair
omxVCM4P10_TransformDequantChromaDCFromPair:
    push    {r4-r10, lr}
    ldr     r9, [r0,#0]
    vmov.i16    d0, #0
    mov     r8, #0x1f
    vst1.16    {d0}, [r1]
    ldrb    r6, [r9], #1
unpackLoop:
    tst     r6, #0x10
    ldrsbne r5, [r9, #1]
    ldrbne  r4, [r9], #2
    and     r7, r8, r6, lsl #1
    ldrsbeq r4, [r9], #1
    orrne   r4, r4, r5, lsl #8
    tst     r6, #0x20
    ldrbeq  r6, [r9], #1
    strh    r4, [r1, r7]
    beq     unpackLoop
    ldmia   r1, {r3, r4}
    str     r9, [r0, #0]
    ldr     r5, .LarmVCM4P10_QPDivTable
P0: add     r5, pc
    ldr     r6, .LarmVCM4P10_VMatrixQPModTable
P1: add     r6, pc
    saddsubx        r3, r3, r3
    saddsubx        r4, r4, r4
    ldrsb   r9, [r5, r2]
    ldrsb   r2, [r6, r2]
    sadd16  r5, r3, r4
    ssub16  r6, r3, r4
    lsl     r2, r2, r9
    vmov    d0, r5, r6
    vrev32.16  d0, d0
    vdup.16    d1, r2
    vmull.s16   q1, d0, d1
    vshrn.i32   d2, q1, #1
    vst1.16    {d2}, [r1]
    mov     r0, #0
    pop     {r4-r10, pc}

.LarmVCM4P10_QPDivTable:
    .word armVCM4P10_QPDivTable-(P0+8)
.LarmVCM4P10_VMatrixQPModTable:
    .word armVCM4P10_VMatrixQPModTable-(P1+8)

    .end
