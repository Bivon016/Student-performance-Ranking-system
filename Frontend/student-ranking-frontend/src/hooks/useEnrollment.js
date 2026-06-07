import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAllSubjects,
  getAllSubjectGroups,
  getStudentEnrollment,
  bulkEnrollStudent,
  removeEnrolledSubject,
} from "../services/api";

export function useEnrollment(studentId) {
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    const calls = [getAllSubjects(), getAllSubjectGroups()];
    if (studentId) calls.push(getStudentEnrollment(studentId));

    Promise.all(calls)
      .then(([subs, grps, enroll]) => {
        setSubjects(subs);
        setGroups(grps);
        if (enroll) setEnrollment(enroll);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  const enroll = useCallback(async (sid, optionalSubjectsByGroup) => {
    setSaving(true);
    setError(null);

    try {
      const result = await bulkEnrollStudent({
        studentId: sid,
        optionalSubjectsByGroup,
      });

      setEnrollment(result);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeSubject = useCallback(async (sid, subjectId) => {
    setSaving(true);
    setError(null);

    try {
      await removeEnrolledSubject(sid, subjectId);

      setEnrollment((prev) =>
        prev
          ? {
              ...prev,
              enrolledSubjects: prev.enrolledSubjects.filter(
                (s) => s.subjectId !== subjectId
              ),
            }
          : prev
      );
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  // optionalChoices derived safely (NO useCallback needed)
  const optionalChoicesFromEnrollment = useMemo(() => {
    const synced = {};

    (enrollment?.enrolledSubjects || []).forEach((s) => {
      if (s.subjectType === "OPTIONAL" && s.optionalGroup) {
        if (!synced[s.optionalGroup]) synced[s.optionalGroup] = new Set();
        synced[s.optionalGroup].add(s.subjectId);
      }
    });

    return synced;
  }, [enrollment]);

  const compulsorySubjects = subjects.filter(
    (s) => s.subjectType === "COMPULSORY"
  );

  const subjectsByGroup = groups.map((g) => ({
    ...g,
    subjects: subjects.filter((s) => s.optionalGroup === g.groupName),
  }));

  return {
    subjects,
    groups,
    compulsorySubjects,
    subjectsByGroup,
    enrollment,
    loading,
    saving,
    error,
    setError,
    enroll,
    removeSubject,
    optionalChoicesFromEnrollment,
  };
}