package com.gradingSystem.GraadingSystem.dto;

public class SubjectGroupDTO {
    private Long id;
    private String groupName;
    private Integer minChoices;
    private Integer maxChoices;

    public SubjectGroupDTO(Integer minChoices, Long id, String groupName, Integer maxChoices) {
        this.minChoices = minChoices;
        this.id = id;
        this.groupName = groupName;
        this.maxChoices = maxChoices;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public Integer getMinChoices() {
        return minChoices;
    }

    public void setMinChoices(int minChoices) {
        this.minChoices = minChoices;
    }

    public Integer getMaxChoices() {
        return maxChoices;
    }

    public void setMaxChoices(int maxChoices) {
        this.maxChoices = maxChoices;
    }
}