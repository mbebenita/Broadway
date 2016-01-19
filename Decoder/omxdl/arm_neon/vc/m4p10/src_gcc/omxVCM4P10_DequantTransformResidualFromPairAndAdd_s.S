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

    .global omxVCM4P10_DequantTransformResidualFromPairAndAdd
omxVCM4P10_DequantTransformResidualFromPairAndAdd:
    PUSH     {r4-r12,lr}
    VPUSH    {d8-d9}
    SUB      sp,sp,#0x20
    ADD      r4,sp,#0
    LDR      r5,[sp,#0x64]
    MOV      r7,r1
    MOV      r8,r2
    MOV      r9,r3
    CMP      r5,#0
    BEQ      L0x114
    MOV      r1,r4
    BL       armVCM4P10_UnpackBlock4x4  ;//
    LDR      r1,[sp,#0x60]
    LDR      r11, .LarmVCM4P10_QPModuloTable
P0: ADD      r11, pc
    LDR      r10, .LarmVCM4P10_QPDivTable
P1: ADD      r10, pc
    LDR      r2, .LarmVCM4P10_VMatrixU16
P2: ADD      r2, pc
    LDRSB    r12,[r11,r1]
    LDRSB    lr,[r10,r1]
    LDR      r10, =0x3020504
    LDR      r1, =0x5040100
    ADD      r2,r2,r12
    VDUP.32  d7,r1
    VDUP.32  d9,r10
    VDUP.16  d5,lr
    VLD1.8   {d6},[r2]
    VTBL.8   d8,{d6},d7
    VTBL.8   d4,{d6},d9
    CMP      r8,#0
    VLD1.16  {d0,d1,d2,d3},[r4]
    VSHL.U16 d8,d8,d5
    VSHL.U16 d4,d4,d5
    BEQ      L1
    LDRSH    r10,[r8,#0]
L1:
    VMUL.I16 d0,d0,d8
    VMUL.I16 d1,d1,d4
    VMUL.I16 d2,d2,d8
    VMUL.I16 d3,d3,d4
    VMOVNE.16 d0[0],r10
    VTRN.16  d0,d1
    VTRN.16  d2,d3
    VTRN.32  q0,q1
    VMOV.I16 d4,#0
    VADD.I16 d5,d0,d2
    VSUB.I16 d6,d0,d2
    VHADD.S16 d7,d1,d4
    VHADD.S16 d8,d3,d4
    VSUB.I16 d7,d7,d3
    VADD.I16 d8,d1,d8
    VADD.I16 d0,d5,d8
    VADD.I16 d1,d6,d7
    VSUB.I16 d2,d6,d7
    VSUB.I16 d3,d5,d8
    VTRN.16  d0,d1
    VTRN.16  d2,d3
    VTRN.32  q0,q1
    VADD.I16 d5,d0,d2
    VSUB.I16 d6,d0,d2
    VHADD.S16 d7,d1,d4
    VHADD.S16 d8,d3,d4
    VSUB.I16 d7,d7,d3
    VADD.I16 d8,d1,d8
    VADD.I16 d0,d5,d8
    VADD.I16 d1,d6,d7
    VSUB.I16 d2,d6,d7
    VSUB.I16 d3,d5,d8
    VRSHR.S16 d0,d0,#6
    VRSHR.S16 d1,d1,#6
    VRSHR.S16 d2,d2,#6
    VRSHR.S16 d3,d3,#6
    B        L0x130
L0x114:
    LDRSH    r10,[r8,#0]
    ADD      r10,r10,#0x20
    ASR      r10,r10,#6
    VDUP.16  d0,r10
    VDUP.16  d1,r10
    VDUP.16  d2,r10
    VDUP.16  d3,r10
L0x130:
    LDR      r1,[sp,#0x58]
    LDR      r10,[sp,#0x5c]
    LDR      r3,[r7],r1
    LDR      r5,[r7],r1
    VMOV     d4,r3,r5
    LDR      r3,[r7],r1
    LDR      r5,[r7,#0]
    VMOV     d5,r3,r5
    VADDW.U8 q3,q0,d4
    VADDW.U8 q4,q1,d5
    VQMOVUN.S16 d0,q3
    VQMOVUN.S16 d1,q4
    VST1.32  {d0[0]},[r9],r10
    VST1.32  {d0[1]},[r9],r10
    VST1.32  {d1[0]},[r9],r10
    VST1.32  {d1[1]},[r9]
    MOV      r0,#0
    ADD      sp,sp,#0x20
    VPOP     {d8-d9}
    POP      {r4-r12,pc}

.LarmVCM4P10_QPModuloTable:
    .word   armVCM4P10_QPModuloTable-(P0+8)
.LarmVCM4P10_QPDivTable:
    .word   armVCM4P10_QPDivTable-(P1+8)
.LarmVCM4P10_VMatrixU16:
    .word   armVCM4P10_VMatrixU16-(P2+8)

    .end

