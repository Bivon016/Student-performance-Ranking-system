package com.gradingSystem.GraadingSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BatchEnrollSubjectsDTO {
    private List<Long> studentIds;
    private List<Long> subjectIds;


}