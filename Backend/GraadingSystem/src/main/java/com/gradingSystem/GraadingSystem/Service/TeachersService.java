package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.TeachersRepo;
import com.gradingSystem.GraadingSystem.model.Teachers;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TeachersService {

    @Autowired
    public TeachersRepo teachersRepo;

    public Teachers addTeacher(Teachers teacher){
        return teachersRepo.save(teacher);
    }

    // Custom method to view all teachers without using List
    public Teachers[] viewAllTeachers() {
        // First, get all teachers from repository
        Iterable<Teachers> iterableTeachers = teachersRepo.findAll(); // still iterable, but not List

        // Count the number of teachers
        int count = 0;
        for (Teachers t : iterableTeachers) {
            count++;
        }

        // Create an array to store teachers
        Teachers[] teachersArray = new Teachers[count];

        // Populate the array
        int index = 0;
        for (Teachers t : iterableTeachers) {
            teachersArray[index++] = t;
        }

        return teachersArray;
    }

    public void deleteTeacher(Long id){
        if(teachersRepo.existsById(id)){
            teachersRepo.deleteById(id);
        }
        else{
            throw new EntityNotFoundException("The teacher does not exist");
        }
    }
}
