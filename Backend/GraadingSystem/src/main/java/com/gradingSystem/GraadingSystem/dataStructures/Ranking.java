package com.gradingSystem.GraadingSystem.dataStructures;

public class Ranking {

    // Sort and assign ranks with ties
    public static void rankStudents(StudentArray students) {
        int n = students.size();
        Student[] arr = students.getAll();

        // Sort descending by totalMarks
        for (int i = 0; i < n - 1; i++) {
            int maxIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j].totalMarks > arr[maxIdx].totalMarks) maxIdx = j;
            }
            // Swap
            Student temp = arr[i];
            arr[i] = arr[maxIdx];
            arr[maxIdx] = temp;
        }

        // Assign ranks with ties
        int rank = 1;
        for (int i = 0; i < n; i++) {
            if (i > 0 && arr[i].totalMarks == arr[i - 1].totalMarks) {
                arr[i].rank = arr[i - 1].rank;
            } else {
                arr[i].rank = rank;
            }
            rank++;
            students.data[i] = arr[i]; // update original array
        }
    }
}
