;//
;// Copyright (C) 2007-2008 ARM Limited
;//
;// Licensed under the Apache License, Version 2.0 (the "License");
;// you may not use this file except in compliance with the License.
;// You may obtain a copy of the License at
;//
;//      http://www.apache.org/licenses/LICENSE-2.0
;//
;// Unless required by applicable law or agreed to in writing, software
;// distributed under the License is distributed on an "AS IS" BASIS,
;// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
;// See the License for the specific language governing permissions and
;// limitations under the License.
;//
;//
;// 
;// File Name:  armVCM4P10_QuantTables_s.s
;// OpenMAX DL: v1.0.2
;// Revision:   12290
;// Date:       Wednesday, April 9, 2008
;// 
;// 
;// 
;// Description:
;// This file contains quantization tables
;// 
;// 

         INCLUDE omxtypes_s.h
         INCLUDE armCOMM_s.h
     
         
         EXPORT armVCM4P10_MFMatrixQPModTable
         EXPORT armVCM4P10_QPDivIntraTable
         EXPORT armVCM4P10_QPDivPlusOneTable  
         
;//--------------------------------------------------------------
;// This table contains armVCM4P10_MFMatrix [iQP % 6][0] entires,
;// for values of iQP from 0 to 51 (inclusive). 
;//--------------------------------------------------------------

         M_TABLE armVCM4P10_MFMatrixQPModTable
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         DCW 13107, 11916, 10082, 9362, 8192, 7282
         
;//---------------------------------------------------------------
;// This table contains ARM_M4P10_Q_OFFSET + 1 + (iQP / 6) values,
;// for values of iQP from 0 to 51 (inclusive). 
;//---------------------------------------------------------------

         M_TABLE armVCM4P10_QPDivPlusOneTable
         DCB 16, 16, 16, 16, 16, 16
         DCB 17, 17, 17, 17, 17, 17
         DCB 18, 18, 18, 18, 18, 18
         DCB 19, 19, 19, 19, 19, 19
         DCB 20, 20, 20, 20, 20, 20
         DCB 21, 21, 21, 21, 21, 21
         DCB 22, 22, 22, 22, 22, 22
         DCB 23, 23, 23, 23, 23, 23
         DCB 24, 24, 24, 24, 24, 24

;//------------------------------------------------------------------
;// This table contains (1 << QbitsPlusOne) / 3 Values (Intra case) ,
;// for values of iQP from 0 to 51 (inclusive). 
;//------------------------------------------------------------------
    
         M_TABLE armVCM4P10_QPDivIntraTable, 2
         DCD 21845, 21845, 21845, 21845, 21845, 21845
         DCD 43690, 43690, 43690, 43690, 43690, 43690
         DCD 87381, 87381, 87381, 87381, 87381, 87381
         DCD 174762, 174762, 174762, 174762, 174762, 174762
         DCD 349525, 349525, 349525, 349525, 349525, 349525
         DCD 699050, 699050, 699050, 699050, 699050, 699050
         DCD 1398101, 1398101, 1398101, 1398101, 1398101, 1398101
         DCD 2796202, 2796202, 2796202, 2796202, 2796202, 2796202
         DCD 5592405, 5592405, 5592405, 5592405, 5592405, 5592405                
         
         
         END
         
