package com.gradingSystem.GraadingSystem.model;

import com.gradingSystem.GraadingSystem.model.School;
import jakarta.persistence.*;

@Entity
public class SubjectGroup {
    @Id
    @GeneratedValue
    private Long id;
    private String groupName;      // "Group A"
    @ManyToOne
    private School school;
    // Add inside SubjectGroup.java

    @Column(nullable = false)
    private Integer minChoices = 1;

    @Column(nullable = false)
    private Integer maxChoices = 1;


    public SubjectGroup(Long id, School school, String groupName,Integer  minChoices,Integer maxChoices) {
        this.id = id;
        this.school = school;
        this.groupName = groupName;
        this.minChoices = minChoices;
        this.maxChoices = maxChoices;
    }

    public SubjectGroup() {
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


    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }
    public Integer getMinChoices() { return minChoices; }
    public void setMinChoices(int minChoices) { this.minChoices = minChoices; }

    public Integer getMaxChoices() { return maxChoices; }
    public void setMaxChoices(int maxChoices) { this.maxChoices = maxChoices; }
}