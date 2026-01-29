//package com.gradingSystem.GraadingSystem.Controller;
//
//import com.gradingSystem.GraadingSystem.dto.StudentRankingDTO;
//import com.gradingSystem.GraadingSystem.Service.RankingService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.util.List;
//
//@RestController
//public class RankingController {
//
//    @Autowired
//    private RankingService rankingService;
//
//    @GetMapping("/rankings")
//    public List<StudentRankingDTO> getRankings() {
//        return rankingService.getStudentRankings();
//    }
//}
package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.dto.StudentRankingDTO;
import com.gradingSystem.GraadingSystem.Service.RankingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ranking")
public class RankingController {

    @Autowired
    private RankingService rankingService;

    //display the students in classes
    @GetMapping("/form/{form}")
    public List<StudentRankingDTO> getFormRanking(@PathVariable int form) {

        return rankingService.rankStudentsByForm(form);
    }
}
