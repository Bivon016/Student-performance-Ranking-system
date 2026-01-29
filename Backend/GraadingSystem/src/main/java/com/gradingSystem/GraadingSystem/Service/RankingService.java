package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.dataStructures.StudentRankNode;
import com.gradingSystem.GraadingSystem.dto.StudentRankingDTO;
import com.gradingSystem.GraadingSystem.dataStructures.MaxHeap;
//import com.gradingSystem.GraadingSystem.dataStructures.MaxHeap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RankingService {

    @Autowired
    private Marksrepo marksrepo;

    public List<StudentRankingDTO> rankStudentsByForm(int form) {

        // Fetch raw totals from repository
        List<Object[]> rawData = marksrepo.getStudentTotalsByForm(form);

        // 1️⃣ Build custom MaxHeap
        MaxHeap heap = new MaxHeap(rawData.size());

        for (Object[] row : rawData) {
            Long studentId = (Long) row[0];
            String name = (String) row[1];
            int totalMarks = ((Number) row[2]).intValue();

            heap.insert(new StudentRankNode(studentId, name, totalMarks));
        }

        // 2️⃣ Extract in rank order and build DTOs
        List<StudentRankingDTO> rankings = new ArrayList<>();
        int rank = 1;

        while (!heap.isEmpty()) {
            StudentRankNode node = heap.extractMax();

            rankings.add(
                    new StudentRankingDTO(
                            node.getStudentId(),
                            node.getStudentName(),
                            node.getTotalMarks(),
                            rank++
                    )
            );
        }

        return rankings;
    }
}
