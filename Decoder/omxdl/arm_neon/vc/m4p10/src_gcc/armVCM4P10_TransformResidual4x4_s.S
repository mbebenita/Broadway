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

    .global armVCM4P10_TransformResidual4x4
armVCM4P10_TransformResidual4x4:
    VPUSH    {d8}
    VLD4.16  {d0,d1,d2,d3},[r1]
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
    VST1.16  {d0,d1,d2,d3},[r0]
    VPOP     {d8}
    BX       lr

    .end

